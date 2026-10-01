const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, now, parseRow, publicUser } = require('./db');
const { sendEntityEventEmail } = require('./mailer');
const { amountToPaise, getRazorpayClient, isGatewayConfigured, isSettledStatus, verifyCheckoutSignature, verifyWebhookSignature } = require('./paymentGateway');
const { getIntegrationConfig, getPublicIntegrationConfig, saveIntegrationConfig } = require('./integrationConfig');
const { registerSuperAdminRoutes } = require('./superAdmin');

const app = express();
const port = process.env.PORT || 4000;
const secret = process.env.JWT_SECRET || 'change-this-secret-in-production';
const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const isAllowedOrigin = origin => !origin
  || origin === configuredClientUrl
  || origin === 'http://localhost:3000'
  || /^https?:\/\/localhost:\d+$/.test(origin)
  || /^https:\/\/[a-z0-9.-]+-\d+\.app\.github\.dev$/.test(origin);
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin))
}));
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) return res.status(400).json({ message: 'Invalid webhook signature' });
  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const providerPayment = event.payload?.payment?.entity;
    if (providerPayment && event.event === 'payment.captured') {
      const result = settleGatewayPayment(providerPayment);
      if (result.changed) await sendEntityEventEmail('payment.updated', 'payments', result.payment);
    } else if (providerPayment && event.event === 'payment.failed') {
      markGatewayPaymentFailed(providerPayment);
    }
    res.json({ data: { received: true } });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error.message);
    res.status(400).json({ message: 'Unable to process payment webhook' });
  }
});
app.use(express.json());
const id = value => Number.parseInt(value, 10);
const today = () => new Date().toISOString().slice(0, 10);
const auth = (req, res, next) => {
  try {
    const claims = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), secret);
    const user = db.prepare(`SELECT users.*, roles.modules AS roleModules, roles.permissions AS rolePermissions
      FROM users LEFT JOIN roles ON roles.id=users.roleId AND roles.tenantId=users.tenantId WHERE users.id=?`).get(claims.id);
    if (!user || user.status !== 'active') return res.status(401).json({ message: 'Authentication required' });
    req.user = {
      id: user.id, name: user.name, email: user.email, role: user.role, roleId: user.roleId,
      tenantId: user.tenantId, modules: JSON.parse(user.roleModules || '[]'),
      permissions: JSON.parse(user.rolePermissions || '[]')
    };
    next();
  } catch { res.status(401).json({ message: 'Authentication required' }); }
};
const superAdminOnly = (req, res, next) => req.user.role === 'super_admin'
  ? next()
  : res.status(403).json({ message: 'Platform super admin access required' });
const tenantUser = (req, res, next) => {
  if (req.user.role === 'super_admin' || !req.user.tenantId) return res.status(403).json({ message: 'Tenant account required' });
  const tenant = db.prepare('SELECT status FROM tenants WHERE id=?').get(req.user.tenantId);
  if (!tenant || tenant.status !== 'active') return res.status(403).json({ message: 'Tenant is inactive' });
  next();
};
const requirePermission = (module, action) => (req, res, next) => {
  if (req.user.role === 'super_admin' || !req.user.tenantId) return res.status(403).json({ message: 'Tenant account required' });
  const tenant = db.prepare('SELECT status FROM tenants WHERE id=?').get(req.user.tenantId);
  if (!tenant || tenant.status !== 'active') return res.status(403).json({ message: 'Tenant is inactive' });
  if (!req.user.modules.includes(module) || (!req.user.permissions.includes('all') && !req.user.permissions.includes(action))) {
    return res.status(403).json({ message: 'Your role does not have permission for this action' });
  }
  next();
};
const safe = (fn, res) => {
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') {
      result.catch(error => {
        if (!res.headersSent) res.status(400).json({ message: error.message });
      });
    }
  } catch (error) {
    if (!res.headersSent) res.status(400).json({ message: error.message });
  }
};
const normalize = (table, row) => {
  if (!row) return row;
  const item = parseRow(row);
  if (table === 'orders') item.customerName = item.customerName || db.prepare('SELECT name FROM customers WHERE id=? AND tenantId=?').get(item.customerId, item.tenantId)?.name || 'Unknown';
  if (table === 'payments') { const order = item.orderId ? db.prepare('SELECT amount,balanceAmount FROM orders WHERE id=? AND tenantId=?').get(item.orderId, item.tenantId) : null; Object.assign(item, { totalAmount: item.totalAmount ?? order?.amount ?? item.amount, advancePaid: item.advancePaid ?? (isSettledStatus(item.status) ? item.amount : 0), paymentMode: item.paymentMode ?? item.paymentMethod, balanceAmount: item.balanceAmount ?? order?.balanceAmount ?? 0 }); }
  if (table === 'inventory') Object.assign(item, { itemName: item.itemName ?? item.name, minStock: item.minStock ?? item.minStockLevel, supplierName: item.supplierName ?? item.supplier, purchaseCost: item.purchaseCost ?? item.unitPrice });
  return item;
};
const rows = (table, where = '', params = [], tenantId) => db.prepare(`SELECT * FROM ${table} WHERE tenantId=? ${where ? `AND (${where.replace(/^WHERE\s+/i, '')})` : ''}`).all(tenantId, ...params).map(row => normalize(table, row));
const byId = (table, key, tenantId) => normalize(table, db.prepare(`SELECT * FROM ${table} WHERE id=? AND tenantId=?`).get(id(key), tenantId));
const gatewayMethodName = method => ({ upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet', emi: 'EMI', paylater: 'Pay Later' })[String(method || '').toLowerCase()] || 'Razorpay';
const settleGatewayPayment = providerPayment => {
  const current = db.prepare('SELECT * FROM payments WHERE gatewayOrderId=?').get(providerPayment.order_id);
  if (!current) return { payment: null, changed: false };
  if (providerPayment.status !== 'captured' || providerPayment.currency !== 'INR' || Number(providerPayment.amount) !== amountToPaise(current.amount)) throw new Error('Gateway payment details do not match the pending payment');

  return db.transaction(() => {
    const latest = db.prepare('SELECT * FROM payments WHERE id=? AND tenantId=?').get(current.id, current.tenantId);
    if (!latest) return { payment: null, changed: false };
    if (isSettledStatus(latest.status)) return { payment: byId('payments', latest.id, latest.tenantId), changed: false };
    db.prepare('UPDATE payments SET status=?,paymentMethod=?,gatewayPaymentId=?,transactionId=?,paymentDate=? WHERE id=? AND tenantId=?').run('Paid', gatewayMethodName(providerPayment.method), providerPayment.id, providerPayment.id, today(), latest.id, latest.tenantId);
    if (latest.orderId) db.prepare('UPDATE orders SET balanceAmount=MAX(0,balanceAmount-?) WHERE id=? AND tenantId=?').run(latest.amount, latest.orderId, latest.tenantId);
    return { payment: byId('payments', latest.id, latest.tenantId), changed: true };
  })();
};
const markGatewayPaymentFailed = providerPayment => {
  if (!providerPayment.order_id) return;
  const current = db.prepare('SELECT id,status,tenantId FROM payments WHERE gatewayOrderId=?').get(providerPayment.order_id);
  if (current && !isSettledStatus(current.status)) db.prepare('UPDATE payments SET status=? WHERE id=? AND tenantId=?').run('Failed', current.id, current.tenantId);
};
const paymentStatuses = new Set(['Pending', 'Paid', 'Completed', 'Failed', 'Refunded']);
const createManualPayment = (data, tenantId) => {
  if (data.gatewayProvider) throw new Error('Gateway payments must be created through checkout');
  const amountPaise = amountToPaise(data.amount ?? data.advancePaid);
  const status = data.status || 'Paid';
  const method = data.paymentMethod || data.paymentMode || data.method;
  if (!paymentStatuses.has(status)) throw new Error('Invalid payment status');
  if (!method) throw new Error('Choose a payment method');
  const paymentId = db.transaction(() => {
    const order = data.orderId ? db.prepare('SELECT * FROM orders WHERE id=? AND tenantId=?').get(id(data.orderId), tenantId) : null;
    if (data.orderId && !order) throw new Error('Order not found');
    const customerId = data.customerId ? id(data.customerId) : order?.customerId;
    const customer = customerId ? db.prepare('SELECT * FROM customers WHERE id=? AND tenantId=?').get(customerId, tenantId) : null;
    if (!customer) throw new Error('Customer not found');
    if (order && order.customerId !== customer.id) throw new Error('Selected customer does not match the order');
    if (order && isSettledStatus(status) && amountPaise > Math.round(Number(order.balanceAmount) * 100)) throw new Error('Payment amount exceeds the order balance');
    const result = db.prepare('INSERT INTO payments (orderId,customerId,customerName,amount,paymentMethod,paymentDate,status,transactionId,notes,tenantId) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(order?.id || null, customer.id, customer.name, amountPaise / 100, method, data.paymentDate || today(), status, `MAN${crypto.randomUUID()}`, data.notes || '', tenantId);
    if (order && isSettledStatus(status)) db.prepare('UPDATE orders SET balanceAmount=MAX(0,balanceAmount-?) WHERE id=? AND tenantId=?').run(amountPaise / 100, order.id, tenantId);
    return result.lastInsertRowid;
  })();
  return byId('payments', paymentId, tenantId);
};
const updatePayment = (paymentKey, data, tenantId) => {
  const current = db.prepare('SELECT * FROM payments WHERE id=? AND tenantId=?').get(id(paymentKey), tenantId);
  if (!current) throw new Error('Payment not found');
  if (current.gatewayProvider) {
    if (['amount', 'orderId', 'customerId', 'paymentMethod', 'paymentMode', 'status', 'paymentDate'].some(key => data[key] !== undefined)) throw new Error('Gateway payment details are managed by Razorpay');
    db.prepare('UPDATE payments SET notes=? WHERE id=? AND tenantId=?').run(data.notes ?? current.notes, current.id, tenantId);
    return byId('payments', current.id, tenantId);
  }
  if (data.orderId !== undefined && id(data.orderId) !== current.orderId) throw new Error('A payment cannot be reassigned to another order');
  if (data.customerId !== undefined && id(data.customerId) !== current.customerId) throw new Error('A payment cannot be reassigned to another customer');
  const amountPaise = data.amount === undefined && data.advancePaid === undefined ? amountToPaise(current.amount) : amountToPaise(data.amount ?? data.advancePaid);
  const status = data.status || current.status;
  const method = data.paymentMethod || data.paymentMode || data.method || current.paymentMethod;
  if (!paymentStatuses.has(status)) throw new Error('Invalid payment status');
  const updated = db.transaction(() => {
    const order = current.orderId ? db.prepare('SELECT amount,balanceAmount FROM orders WHERE id=? AND tenantId=?').get(current.orderId, tenantId) : null;
    const oldApplied = isSettledStatus(current.status) ? Math.round(Number(current.amount) * 100) : 0;
    const newApplied = isSettledStatus(status) ? amountPaise : 0;
    if (order && newApplied > Math.round(Number(order.balanceAmount) * 100) + oldApplied) throw new Error('Payment amount exceeds the order balance');
    if (order) {
      const balancePaise = Math.min(Math.round(Number(order.amount) * 100), Math.max(0, Math.round(Number(order.balanceAmount) * 100) + oldApplied - newApplied));
      db.prepare('UPDATE orders SET balanceAmount=? WHERE id=? AND tenantId=?').run(balancePaise / 100, current.orderId, tenantId);
    }
    db.prepare('UPDATE payments SET amount=?,paymentMethod=?,paymentDate=?,status=?,notes=? WHERE id=?')
      .run(amountPaise / 100, method, data.paymentDate || current.paymentDate, status, data.notes ?? current.notes, current.id);
    return current.id;
  })();
  return byId('payments', updated, tenantId);
};
const deletePayment = (paymentKey, tenantId) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id=? AND tenantId=?').get(id(paymentKey), tenantId);
  if (!payment) throw new Error('Payment not found');
  if (payment.gatewayProvider) throw new Error('Gateway payments cannot be deleted');
  db.transaction(() => {
    if (payment.orderId && isSettledStatus(payment.status)) {
      db.prepare('UPDATE orders SET balanceAmount=MIN(amount,balanceAmount+?) WHERE id=? AND tenantId=?').run(payment.amount, payment.orderId, tenantId);
    }
    db.prepare('DELETE FROM payments WHERE id=?').run(payment.id);
  })();
};

const publicAuthUser = user => {
  const role = user.roleId ? db.prepare('SELECT modules,permissions FROM roles WHERE id=? AND tenantId=?').get(user.roleId, user.tenantId) : null;
  return { ...publicUser(user), modules: JSON.parse(role?.modules || '[]'), permissions: JSON.parse(role?.permissions || '[]') };
};
const login = (req, res, platformOnly) => safe(() => {
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(String(req.body.email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password) || user.status !== 'active') throw new Error('Invalid email or password');
  if (platformOnly !== (user.role === 'super_admin')) throw new Error(platformOnly ? 'Invalid super admin credentials' : 'Use the platform super admin sign-in');
  if (user.tenantId) {
    const tenant = db.prepare('SELECT status FROM tenants WHERE id=?').get(user.tenantId);
    if (!tenant || tenant.status !== 'active') throw new Error('This tenant is inactive');
  }
  db.prepare('UPDATE users SET lastLogin=? WHERE id=?').run(now, user.id);
  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
  res.json({ data: { token, user: publicAuthUser({ ...user, lastLogin: now }) } });
}, res);

app.get('/api/payments/gateway/config', auth, requirePermission('payments', 'read'), (req, res) => res.json({ data: {
  provider: 'razorpay',
  configured: isGatewayConfigured(),
  keyId: isGatewayConfigured() ? getIntegrationConfig().razorpayKeyId : null
} }));
app.get('/api/settings/integrations', auth, superAdminOnly, (req, res) => res.json({ data: getPublicIntegrationConfig() }));
app.put('/api/settings/integrations', auth, superAdminOnly, (req, res) => safe(() => {
  const data = req.body || {};
  if (data.mailPort !== undefined && (!Number.isInteger(Number(data.mailPort)) || Number(data.mailPort) < 1 || Number(data.mailPort) > 65535)) throw new Error('SMTP port must be between 1 and 65535');
  if (data.mailSecure !== undefined && typeof data.mailSecure !== 'boolean') throw new Error('SMTP secure must be true or false');
  const allowed = ['mailHost', 'mailPort', 'mailSecure', 'mailUser', 'mailFrom', 'mailNotifyEmails', 'mailPassword', 'razorpayKeyId', 'razorpayKeySecret', 'razorpayWebhookSecret'];
  for (const field of allowed) {
    if (data[field] !== undefined && typeof data[field] !== (field === 'mailPort' ? 'number' : field === 'mailSecure' ? 'boolean' : 'string')) throw new Error(`Invalid ${field} value`);
    if (typeof data[field] === 'string' && data[field].length > 2048) throw new Error(`${field} is too long`);
  }
  res.json({ data: saveIntegrationConfig(data) });
}, res));
app.post('/api/payments/gateway/orders', auth, requirePermission('payments', 'create'), (req, res) => safe(async () => {
  const order = byId('orders', req.body.orderId, req.user.tenantId);
  if (!order) throw new Error('Order not found');
  const amountPaise = amountToPaise(req.body.amount);
  const orderBalancePaise = amountToPaise(order.balanceAmount);
  if (amountPaise > orderBalancePaise) throw new Error('Payment amount exceeds the order balance');
  const customer = byId('customers', order.customerId, req.user.tenantId);
  const receipt = `PAY${crypto.randomBytes(12).toString('hex')}`;
  const gatewayOrder = await getRazorpayClient().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: { localOrderId: String(order.id), customerId: String(order.customerId) }
  });
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
  const paymentId = db.transaction(() => {
    const latestOrder = db.prepare('SELECT balanceAmount FROM orders WHERE id=? AND tenantId=?').get(order.id, req.user.tenantId);
    if (!latestOrder || amountPaise > amountToPaise(latestOrder.balanceAmount)) throw new Error('Order balance changed; refresh and try again');
    return db.prepare('INSERT INTO payments (orderId,customerId,customerName,amount,paymentMethod,paymentDate,status,transactionId,notes,gatewayProvider,gatewayOrderId,gatewayExpiresAt,tenantId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(order.id, order.customerId, customer?.name || order.customerName, amountPaise / 100, 'Razorpay', today(), 'Pending', receipt, req.body.notes || '', 'razorpay', gatewayOrder.id, expiresAt, req.user.tenantId).lastInsertRowid;
  })();
  const payment = byId('payments', paymentId, req.user.tenantId);
  const email = await sendEntityEventEmail('payment.created', 'payments', payment);
  res.status(201).json({ data: {
    payment,
    checkout: {
      keyId: getIntegrationConfig().razorpayKeyId,
      orderId: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      customerName: customer?.name || order.customerName,
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      orderReference: order.orderId
    },
    email
  } });
}, res));
app.post('/api/payments/gateway/verify', auth, requirePermission('payments', 'create'), (req, res) => safe(async () => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!verifyCheckoutSignature(orderId, paymentId, signature)) throw new Error('Payment signature verification failed');
  const pending = db.prepare('SELECT * FROM payments WHERE gatewayOrderId=? AND tenantId=?').get(orderId, req.user.tenantId);
  if (!pending) throw new Error('Pending payment not found');
  const provider = getRazorpayClient();
  let providerPayment = await provider.payments.fetch(paymentId);
  if (providerPayment.order_id !== orderId || Number(providerPayment.amount) !== amountToPaise(pending.amount) || providerPayment.currency !== 'INR') throw new Error('Payment does not match the pending order');
  if (providerPayment.status === 'authorized') providerPayment = await provider.payments.capture(paymentId, Number(providerPayment.amount), 'INR');
  const result = settleGatewayPayment(providerPayment);
  if (!result.payment || !isSettledStatus(result.payment.status)) throw new Error('Payment has not been captured yet');
  if (result.changed) await sendEntityEventEmail('payment.updated', 'payments', result.payment);
  res.json({ data: result.payment });
}, res));

app.post('/api/auth/login', (req, res) => login(req, res, false));
app.post('/api/super-admin/login', (req, res) => login(req, res, true));
app.post('/api/auth/register', auth, requirePermission('users', 'create'), (req, res) => safe(async () => {
  const data = req.body;
  const role = db.prepare('SELECT * FROM roles WHERE id=? AND tenantId=?').get(id(data.roleId), req.user.tenantId);
  if (!role) throw new Error('Choose a role configured for this tenant');
  const result = db.prepare('INSERT INTO users (name,email,password,phone,address,role,roleId,tenantId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)').run(data.name, data.email, bcrypt.hashSync(data.password || 'password123', 10), data.phone || '', data.address || '', role.name, role.id, req.user.tenantId, 'active', now);
  const created = publicAuthUser(byId('users', result.lastInsertRowid, req.user.tenantId));
  const email = await sendEntityEventEmail('user.created', 'users', created);
  res.status(201).json({ data: created, email });
}, res));
app.get('/api/auth/me', auth, (req, res) => res.json({ data: publicAuthUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) }));
app.post('/api/auth/logout', auth, (req, res) => res.json({ data: { message: 'Logged out successfully' } }));
app.put('/api/auth/profile/:id', auth, (req, res) => safe(async () => {
  if (id(req.params.id) !== req.user.id) throw new Error('You may only update your own profile');
  const data = req.body;
  db.prepare('UPDATE users SET name=COALESCE(?,name),phone=COALESCE(?,phone),address=COALESCE(?,address),email=COALESCE(?,email) WHERE id=? AND tenantId IS ?').run(data.name, data.phone, data.address, data.email, id(req.params.id), req.user.tenantId);
  const updated = publicAuthUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id));
  const email = await sendEntityEventEmail('user.updated', 'users', updated);
  res.json({ data: updated, email });
}, res));
app.put('/api/auth/password/:id', auth, (req, res) => safe(async () => {
  if (id(req.params.id) !== req.user.id) throw new Error('You may only change your own password');
  const user = db.prepare('SELECT * FROM users WHERE id=? AND tenantId IS ?').get(id(req.params.id), req.user.tenantId);
  if (!user || !bcrypt.compareSync(req.body.currentPassword || '', db.prepare('SELECT password FROM users WHERE id=?').get(user.id).password)) throw new Error('Current password is incorrect');
  if (req.body.currentPassword === req.body.newPassword) throw new Error('New password must be different from current password');
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(req.body.newPassword, 10), user.id);
  const email = await sendEntityEventEmail('user.updated', 'users', user);
  res.json({ data: { message: 'Password changed successfully' }, email });
}, res));

function resource({ path, table, singular, wrapper }) {
  const eventName = { customers: 'customer', orders: 'order', payments: 'payment', inventory: 'inventory', users: 'user', roles: 'role' }[table];
  const module = table === 'roles' ? 'users' : table;
  app.get(`/api/${path}`, auth, requirePermission(module, 'read'), (req, res) => safe(() => {
    if (table === 'payments') db.prepare("UPDATE payments SET status='Failed' WHERE tenantId=? AND gatewayProvider='razorpay' AND status='Pending' AND gatewayExpiresAt IS NOT NULL AND gatewayExpiresAt<?").run(req.user.tenantId, new Date().toISOString());
    let result = rows(table, '', [], req.user.tenantId);
    const search = (req.query.search || '').toLowerCase();
    if (search) result = result.filter(item => JSON.stringify(item).toLowerCase().includes(search));
    if (req.query.status) result = result.filter(item => String(item.status).toLowerCase() === req.query.status.toLowerCase());
    if (req.query.customerId) result = result.filter(item => item.customerId === id(req.query.customerId));
    if (table === 'users') result = result.map(publicAuthUser);
    res.json({ data: wrapper ? { [wrapper]: result } : result });
  }, res));
  app.get(`/api/${path}/:id`, auth, requirePermission(module, 'read'), (req, res) => {
    if (table === 'inventory' && req.params.id === 'low-stock') return res.json({ data: rows('inventory', 'WHERE quantity <= minStockLevel', [], req.user.tenantId) });
    const item = byId(table, req.params.id, req.user.tenantId);
    if (!item) return res.status(404).json({ message: `${singular} not found` });
    res.json({ data: table === 'users' ? publicAuthUser(item) : item });
  });
  app.post(`/api/${path}`, auth, requirePermission(module, 'create'), (req, res) => safe(async () => {
    const data = req.body; let result;
    if (table === 'customers') result = db.prepare('INSERT INTO customers (customerId,name,email,phone,address,dateAdded,measurements,tenantId) VALUES (?,?,?,?,?,?,?,?)').run(`CUST${String(Date.now()).slice(-6)}`, data.name, data.email || '', data.phone || '', data.address || '', data.dateAdded || today(), JSON.stringify(data.measurements || {}), req.user.tenantId);
    else if (table === 'orders') {
      const customer = db.prepare('SELECT id FROM customers WHERE id=? AND tenantId=?').get(id(data.customerId), req.user.tenantId);
      if (!customer) throw new Error('Customer not found');
      result = db.prepare('INSERT INTO orders (orderId,customerId,dressType,fabricType,orderDate,trialDate,deliveryDate,status,assignedTo,amount,balanceAmount,notes,tenantId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(`ORD${String(Date.now()).slice(-6)}`, customer.id, data.dressType || '', data.fabricType || '', data.orderDate || today(), data.trialDate || '', data.deliveryDate || '', data.status || 'New', data.assignedTo || '', Number(data.amount) || 0, Number(data.balanceAmount ?? data.amount) || 0, data.notes || '', req.user.tenantId);
    } else if (table === 'inventory') result = db.prepare('INSERT INTO inventory (name,category,sku,quantity,unit,minStockLevel,unitPrice,supplier,status,lastRestocked,notes,tenantId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(data.name || data.itemName, data.category || '', data.sku || `SKU${Date.now()}`, Number(data.quantity) || 0, data.unit || '', Number(data.minStockLevel ?? data.minStock) || 10, Number(data.unitPrice) || 0, data.supplier || '', Number(data.quantity) <= Number(data.minStockLevel ?? data.minStock ?? 10) ? 'Low Stock' : 'In Stock', today(), data.notes || '', req.user.tenantId);
    else if (table === 'users') {
      const role = db.prepare('SELECT * FROM roles WHERE id=? AND tenantId=?').get(id(data.roleId), req.user.tenantId);
      if (!role || role.name === 'owner') throw new Error('Choose a tenant role provisioned by the platform admin');
      result = db.prepare('INSERT INTO users (name,email,password,phone,address,role,roleId,tenantId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)').run(data.name, data.email, bcrypt.hashSync(data.password || 'password123', 10), data.phone || '', data.address || '', role.name, role.id, req.user.tenantId, 'active', now);
    } else if (table === 'roles') throw new Error('Role privileges are managed by the platform super admin');
    else if (table === 'payments') {
      const payment = createManualPayment(data, req.user.tenantId);
      const email = await sendEntityEventEmail('payment.created', 'payments', payment);
      return res.status(201).json({ data: payment, email });
    }
    const created = byId(table, result.lastInsertRowid, req.user.tenantId);
    const response = table === 'users' ? publicAuthUser(created) : created;
    const email = await sendEntityEventEmail(`${eventName}.created`, table, response);
    res.status(201).json({ data: response, email });
  }, res));
  app.put(`/api/${path}/:id`, auth, requirePermission(module, 'update'), (req, res) => safe(async () => {
    const input = { ...req.body }; delete input.id;
    if (table === 'payments') {
      const item = updatePayment(req.params.id, input, req.user.tenantId);
      const email = await sendEntityEventEmail('payment.updated', 'payments', item);
      return res.json({ data: item, email });
    }
    if (table === 'roles') throw new Error('Role privileges are managed by the platform super admin');
    const current = byId(table, req.params.id, req.user.tenantId);
    if (!current) throw new Error(`${singular} not found`);
    const aliases = table === 'inventory' ? { name: input.itemName, minStockLevel: input.minStock, supplier: input.supplierName, unitPrice: input.purchaseCost } : {};
    const allowed = { customers: ['name','email','phone','address','dateAdded','measurements'], orders: ['customerId','dressType','fabricType','orderDate','trialDate','deliveryDate','status','assignedTo','amount','balanceAmount','notes'], inventory: ['name','category','sku','quantity','unit','minStockLevel','unitPrice','supplier','status','lastRestocked','notes'], users: ['name','email','password','phone','address','roleId','status'] }[table];
    const data = Object.fromEntries([...Object.entries(input), ...Object.entries(aliases)].filter(([key, value]) => allowed.includes(key) && value !== undefined));
    if (table === 'users' && current.role === 'owner' && ['roleId', 'status'].some(field => data[field] !== undefined)) throw new Error('Tenant admin privileges are managed by the platform super admin');
    if (table === 'orders' && data.customerId !== undefined && !db.prepare('SELECT 1 FROM customers WHERE id=? AND tenantId=?').get(id(data.customerId), req.user.tenantId)) throw new Error('Customer not found');
    if (table === 'users' && data.roleId !== undefined) {
      const role = db.prepare('SELECT * FROM roles WHERE id=? AND tenantId=?').get(id(data.roleId), req.user.tenantId);
      if (!role || role.name === 'owner') throw new Error('Choose a tenant role provisioned by the platform admin');
      data.role = role.name;
    }
    if (table === 'users' && data.password) data.password = bcrypt.hashSync(data.password, 10);
    if (table === 'customers' && data.measurements) data.measurements = JSON.stringify(data.measurements);
    if (table === 'inventory' && data.quantity !== undefined) data.status = Number(data.quantity) <= Number(data.minStockLevel ?? current.minStockLevel) ? 'Low Stock' : 'In Stock';
    const keys = Object.keys(data);
    if (keys.length) db.prepare(`UPDATE ${table} SET ${keys.map(key => `${key}=?`).join(',')} WHERE id=? AND tenantId=?`).run(...keys.map(key => data[key]), id(req.params.id), req.user.tenantId);
    const item = byId(table, req.params.id, req.user.tenantId);
    const response = table === 'users' ? publicAuthUser(item) : item;
    const email = await sendEntityEventEmail(`${eventName}.updated`, table, response);
    res.json({ data: response, email });
  }, res));
  app.delete(`/api/${path}/:id`, auth, requirePermission(module, 'delete'), (req, res) => safe(() => {
    if (table === 'payments') deletePayment(req.params.id, req.user.tenantId);
    else if (table === 'roles') throw new Error('Role privileges are managed by the platform super admin');
    else {
      const item = byId(table, req.params.id, req.user.tenantId);
      if (!item) throw new Error(`${singular} not found`);
      if (table === 'users' && item.role === 'owner') throw new Error('Tenant admin accounts are managed by the platform super admin');
      db.prepare(`DELETE FROM ${table} WHERE id=? AND tenantId=?`).run(id(req.params.id), req.user.tenantId);
    }
    res.json({ data: { message: `${singular} deleted` } });
  }, res));
}
resource({ path: 'customers', table: 'customers', singular: 'Customer', wrapper: 'customers' });
resource({ path: 'orders', table: 'orders', singular: 'Order', wrapper: 'orders' });
resource({ path: 'payments', table: 'payments', singular: 'Payment', wrapper: 'payments' });
resource({ path: 'inventory', table: 'inventory', singular: 'Inventory item', wrapper: 'inventory' });
resource({ path: 'users', table: 'users', singular: 'User', wrapper: 'users' });
resource({ path: 'roles', table: 'roles', singular: 'Role', wrapper: 'roles' });

app.post('/api/customers/:id/measurements', auth, requirePermission('customers', 'update'), (req, res) => safe(async () => {
  const customer = byId('customers', req.params.id, req.user.tenantId);
  if (!customer) throw new Error('Customer not found');
  db.prepare('UPDATE customers SET measurements=? WHERE id=? AND tenantId=?').run(JSON.stringify(req.body), customer.id, req.user.tenantId);
  const item = byId('customers', req.params.id, req.user.tenantId);
  const email = await sendEntityEventEmail('customer.measurementsUpdated', 'customers', item);
  res.json({ data: item, email });
}, res));
app.get('/api/customers/:id/orders', auth, requirePermission('orders', 'read'), (req, res) => {
  if (!byId('customers', req.params.id, req.user.tenantId)) return res.status(404).json({ message: 'Customer not found' });
  res.json({ data: rows('orders', 'WHERE customerId=?', [id(req.params.id)], req.user.tenantId) });
});
app.patch('/api/orders/:id/status', auth, requirePermission('orders', 'update'), (req, res) => safe(async () => {
  if (!byId('orders', req.params.id, req.user.tenantId)) throw new Error('Order not found');
  db.prepare('UPDATE orders SET status=?,notes=COALESCE(?,notes) WHERE id=? AND tenantId=?').run(req.body.status, req.body.notes, id(req.params.id), req.user.tenantId);
  const item = byId('orders', req.params.id, req.user.tenantId);
  const email = await sendEntityEventEmail('order.statusChanged', 'orders', item);
  res.json({ data: item, email });
}, res));
app.patch('/api/orders/:id/assign', auth, requirePermission('orders', 'update'), (req, res) => safe(async () => {
  if (!byId('orders', req.params.id, req.user.tenantId)) throw new Error('Order not found');
  db.prepare('UPDATE orders SET assignedTo=? WHERE id=? AND tenantId=?').run(req.body.staffId, id(req.params.id), req.user.tenantId);
  const item = byId('orders', req.params.id, req.user.tenantId);
  const email = await sendEntityEventEmail('order.assigned', 'orders', item);
  res.json({ data: item, email });
}, res));
app.patch('/api/inventory/:id/quantity', auth, requirePermission('inventory', 'update'), (req, res) => safe(async () => {
  if (!byId('inventory', req.params.id, req.user.tenantId)) throw new Error('Inventory item not found');
  db.prepare("UPDATE inventory SET quantity=?,status=CASE WHEN ? <= minStockLevel THEN 'Low Stock' ELSE 'In Stock' END,lastRestocked=? WHERE id=? AND tenantId=?").run(Number(req.body.quantity), Number(req.body.quantity), today(), id(req.params.id), req.user.tenantId);
  const item = byId('inventory', req.params.id, req.user.tenantId);
  const email = await sendEntityEventEmail('inventory.quantityUpdated', 'inventory', item);
  res.json({ data: item, email });
}, res));
app.patch('/api/users/:id/status', auth, requirePermission('users', 'update'), (req, res) => safe(async () => {
  const user = byId('users', req.params.id, req.user.tenantId);
  if (!user || user.role === 'owner') throw new Error('Tenant admin status is managed by the platform super admin');
  db.prepare("UPDATE users SET status=CASE WHEN status='active' THEN 'inactive' ELSE 'active' END WHERE id=? AND tenantId=?").run(user.id, req.user.tenantId);
  const item = publicAuthUser(byId('users', req.params.id, req.user.tenantId));
  const email = await sendEntityEventEmail('user.statusChanged', 'users', item);
  res.json({ data: item, email });
}, res));
app.get('/api/users/stats/:id', auth, tenantUser, (req, res) => {
  const user = byId('users', req.params.id, req.user.tenantId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.id !== req.user.id && !req.user.permissions.includes('all') && (!req.user.modules.includes('users') || !req.user.permissions.includes('read'))) return res.status(403).json({ message: 'Your role does not have permission for this action' });
  const orders = user.role === 'owner' ? rows('orders', '', [], req.user.tenantId) : rows('orders', 'WHERE assignedTo=?', [user.name], req.user.tenantId);
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) value FROM payments WHERE tenantId=? AND lower(status) IN ('paid','completed','captured')").get(req.user.tenantId).value;
  res.json({ data: { totalOrders: orders.length, completedOrders: orders.filter(o => o.status === 'Delivered').length, pendingOrders: orders.filter(o => o.status !== 'Delivered').length, totalCustomers: rows('customers', '', [], req.user.tenantId).length, totalRevenue } });
});
app.get('/api/inventory/low-stock', auth, requirePermission('inventory', 'read'), (req, res) => res.json({ data: rows('inventory', 'WHERE quantity <= minStockLevel', [], req.user.tenantId) }));
app.get('/api/dashboard/owner', auth, requirePermission('dashboard', 'read'), (req, res) => {
  const orders = rows('orders', '', [], req.user.tenantId);
  const customers = rows('customers', '', [], req.user.tenantId);
  const payments = rows('payments', '', [], req.user.tenantId);
  const settledPayments = payments.filter(payment => isSettledStatus(payment.status));
  const inventory = rows('inventory', '', [], req.user.tenantId);
  const revenue = settledPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const statusCounts = [...new Set(orders.map(order => order.status))].map(name => ({ name, value: orders.filter(order => order.status === name).length }));
  const revenueChart = [...new Set(settledPayments.map(payment => payment.paymentDate.slice(0, 7)))].sort().map(month => ({ month, revenue: settledPayments.filter(payment => payment.paymentDate.startsWith(month)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0) }));
  res.json({ data: { revenue: { today: revenue, thisWeek: revenue, thisMonth: revenue, thisYear: revenue }, orders: { total: orders.length, pending: orders.filter(order => order.status === 'New').length, inProgress: orders.filter(order => !['New','Delivered'].includes(order.status)).length, completed: orders.filter(order => order.status === 'Delivered').length }, customers: { total: customers.length, new: customers.length, active: customers.length }, payments: { pending: orders.reduce((sum, order) => sum + Number(order.balanceAmount || 0), 0), overdue: 0, received: revenue }, recentOrders: orders.slice(-5).reverse(), lowStockItems: inventory.filter(item => item.quantity <= item.minStockLevel), upcomingDueDates: orders.filter(order => order.status !== 'Delivered').slice(0, 5), revenueChart, orderStatusChart: statusCounts } });
});
app.get('/api/dashboard/staff', auth, requirePermission('dashboard', 'read'), (req, res) => {
  const orders = rows('orders', 'WHERE assignedTo=?', [req.user.name], req.user.tenantId);
  res.json({ data: { myOrders: orders, pending: orders.filter(order => order.status === 'New').length, inProgress: orders.filter(order => order.status !== 'New' && order.status !== 'Delivered').length, completed: orders.filter(order => order.status === 'Delivered').length, upcomingDueDates: orders.filter(order => order.status !== 'Delivered') } });
});
app.get('/api/dashboard/reports', auth, requirePermission('reports', 'read'), (req, res) => {
  const orders = rows('orders', '', [], req.user.tenantId);
  const payments = rows('payments', '', [], req.user.tenantId);
  const customers = rows('customers', '', [], req.user.tenantId);
  const inventory = rows('inventory', '', [], req.user.tenantId);
  res.json({ data: { summary: { totalOrders: orders.length, totalCustomers: customers.length, totalRevenue: payments.filter(payment => isSettledStatus(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0), inventoryValue: inventory.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0) }, orders, payments, customers, inventory } });
});

registerSuperAdminRoutes(app, { auth, superAdminOnly, safe });
app.listen(port, () => console.log(`Boutique API listening on http://localhost:${port}`));
