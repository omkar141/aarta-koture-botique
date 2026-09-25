const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, now, parseRow, publicUser } = require('./db');
const { sendEntityEventEmail } = require('./mailer');

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
app.use(express.json());
const id = value => Number.parseInt(value, 10);
const today = () => new Date().toISOString().slice(0, 10);
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), secret); next(); }
  catch { res.status(401).json({ message: 'Authentication required' }); }
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
  if (table === 'orders') item.customerName = item.customerName || db.prepare('SELECT name FROM customers WHERE id=?').get(item.customerId)?.name || 'Unknown';
  if (table === 'payments') { const order = item.orderId ? db.prepare('SELECT amount,balanceAmount FROM orders WHERE id=?').get(item.orderId) : null; Object.assign(item, { totalAmount: item.totalAmount ?? order?.amount ?? item.amount, advancePaid: item.advancePaid ?? item.amount, paymentMode: item.paymentMode ?? item.paymentMethod, balanceAmount: item.balanceAmount ?? order?.balanceAmount ?? 0 }); }
  if (table === 'inventory') Object.assign(item, { itemName: item.itemName ?? item.name, minStock: item.minStock ?? item.minStockLevel, supplierName: item.supplierName ?? item.supplier, purchaseCost: item.purchaseCost ?? item.unitPrice });
  return item;
};
const rows = (table, where = '', params = []) => db.prepare(`SELECT * FROM ${table} ${where}`).all(...params).map(row => normalize(table, row));
const byId = (table, key) => normalize(table, db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id(key)));

app.post('/api/auth/login', (req, res) => safe(() => {
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password) || user.status !== 'active') throw new Error('Invalid email or password');
  db.prepare('UPDATE users SET lastLogin=? WHERE id=?').run(now, user.id);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, secret, { expiresIn: '7d' });
  res.json({ data: { token, user: publicUser({ ...user, lastLogin: now }) } });
}, res));
app.post('/api/auth/register', auth, (req, res) => safe(async () => {
  const data = req.body;
  const result = db.prepare('INSERT INTO users (name,email,password,phone,address,role,roleId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)').run(data.name, data.email, bcrypt.hashSync(data.password || 'password123', 10), data.phone || '', data.address || '', data.role || 'staff', data.roleId || 2, 'active', now);
  const created = publicUser(byId('users', result.lastInsertRowid));
  const email = await sendEntityEventEmail('user.created', 'users', created);
  res.status(201).json({ data: created, email });
}, res));
app.get('/api/auth/me', auth, (req, res) => res.json({ data: publicUser(byId('users', req.user.id)) }));
app.post('/api/auth/logout', auth, (req, res) => res.json({ data: { message: 'Logged out successfully' } }));
app.put('/api/auth/profile/:id', auth, (req, res) => safe(async () => {
  const data = req.body;
  db.prepare('UPDATE users SET name=COALESCE(?,name),phone=COALESCE(?,phone),address=COALESCE(?,address),email=COALESCE(?,email) WHERE id=?').run(data.name, data.phone, data.address, data.email, id(req.params.id));
  const updated = publicUser(byId('users', req.params.id));
  const email = await sendEntityEventEmail('user.updated', 'users', updated);
  res.json({ data: updated, email });
}, res));
app.put('/api/auth/password/:id', auth, (req, res) => safe(async () => {
  const user = byId('users', req.params.id);
  if (!user || !bcrypt.compareSync(req.body.currentPassword || '', db.prepare('SELECT password FROM users WHERE id=?').get(user.id).password)) throw new Error('Current password is incorrect');
  if (req.body.currentPassword === req.body.newPassword) throw new Error('New password must be different from current password');
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(req.body.newPassword, 10), user.id);
  const email = await sendEntityEventEmail('user.updated', 'users', user);
  res.json({ data: { message: 'Password changed successfully' }, email });
}, res));

function resource({ path, table, singular, wrapper }) {
  const eventName = { customers: 'customer', orders: 'order', payments: 'payment', inventory: 'inventory', users: 'user', roles: 'role' }[table];
  app.get(`/api/${path}`, auth, (req, res) => safe(() => {
    let result = rows(table);
    const search = (req.query.search || '').toLowerCase();
    if (search) result = result.filter(item => JSON.stringify(item).toLowerCase().includes(search));
    if (req.query.status) result = result.filter(item => String(item.status).toLowerCase() === req.query.status.toLowerCase());
    if (req.query.customerId) result = result.filter(item => item.customerId === id(req.query.customerId));
    if (table === 'users') result = result.map(publicUser);
    res.json({ data: wrapper ? { [wrapper]: result } : result });
  }, res));
  app.get(`/api/${path}/:id`, auth, (req, res) => { if (table === 'inventory' && req.params.id === 'low-stock') return res.json({ data: rows('inventory', 'WHERE quantity <= minStockLevel') }); const item = byId(table, req.params.id); if (!item) return res.status(404).json({ message: `${singular} not found` }); res.json({ data: item }); });
  app.post(`/api/${path}`, auth, (req, res) => safe(async () => {
    const data = req.body; let result;
    if (table === 'customers') result = db.prepare('INSERT INTO customers (customerId,name,email,phone,address,dateAdded,measurements) VALUES (?,?,?,?,?,?,?)').run(`CUST${String(Date.now()).slice(-6)}`, data.name, data.email || '', data.phone || '', data.address || '', data.dateAdded || today(), JSON.stringify(data.measurements || {}));
    else if (table === 'orders') result = db.prepare('INSERT INTO orders (orderId,customerId,dressType,fabricType,orderDate,trialDate,deliveryDate,status,assignedTo,amount,balanceAmount,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(`ORD${String(Date.now()).slice(-6)}`, id(data.customerId), data.dressType || '', data.fabricType || '', data.orderDate || today(), data.trialDate || '', data.deliveryDate || '', data.status || 'New', data.assignedTo || '', Number(data.amount) || 0, Number(data.balanceAmount ?? data.amount) || 0, data.notes || '');
    else if (table === 'inventory') result = db.prepare('INSERT INTO inventory (name,category,sku,quantity,unit,minStockLevel,unitPrice,supplier,status,lastRestocked,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(data.name || data.itemName, data.category || '', data.sku || `SKU${Date.now()}`, Number(data.quantity) || 0, data.unit || '', Number(data.minStockLevel ?? data.minStock) || 10, Number(data.unitPrice) || 0, data.supplier || '', Number(data.quantity) <= Number(data.minStockLevel ?? data.minStock ?? 10) ? 'Low Stock' : 'In Stock', today(), data.notes || '');
    else if (table === 'users') result = db.prepare('INSERT INTO users (name,email,password,phone,address,role,roleId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)').run(data.name, data.email, bcrypt.hashSync(data.password || 'password123', 10), data.phone || '', data.address || '', data.role || 'staff', data.roleId || 2, 'active', now);
    else if (table === 'roles') result = db.prepare('INSERT INTO roles (name,displayName,description,permissions,modules,createdAt) VALUES (?,?,?,?,?,?)').run((data.name || data.displayName || `role_${Date.now()}`).toLowerCase().replace(/\s+/g, '_'), data.displayName || data.name, data.description || '', JSON.stringify(data.permissions || []), JSON.stringify(data.modules || []), now);
    else if (table === 'payments') {
      const order = data.orderId ? byId('orders', data.orderId) : null;
      const customer = byId('customers', data.customerId || order?.customerId);
      const amount = Number(data.amount ?? data.advancePaid) || 0;
      result = db.prepare('INSERT INTO payments (orderId,customerId,customerName,amount,paymentMethod,paymentDate,status,transactionId,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(data.orderId ? id(data.orderId) : null, data.customerId ? id(data.customerId) : order?.customerId, customer?.name || data.customerName || 'Unknown', amount, data.paymentMethod || data.paymentMode || '', data.paymentDate || today(), data.status || 'Completed', `TXN${Date.now()}`, data.notes || '');
      if (order) db.prepare('UPDATE orders SET balanceAmount=MAX(0,balanceAmount-?) WHERE id=?').run(amount, order.id);
    }
    const created = table === 'users' ? publicUser(byId(table, result.lastInsertRowid)) : byId(table, result.lastInsertRowid);
    const email = await sendEntityEventEmail(`${eventName}.created`, table, created);
    res.status(201).json({ data: created, email });
  }, res));
  app.put(`/api/${path}/:id`, auth, (req, res) => safe(async () => {
    const input = { ...req.body }; delete input.id;
    const aliases = table === 'inventory' ? { name: input.itemName, minStockLevel: input.minStock, supplier: input.supplierName, unitPrice: input.purchaseCost } : table === 'payments' ? { amount: input.advancePaid, paymentMethod: input.paymentMode } : {};
    const allowed = { customers: ['name','email','phone','address','dateAdded','measurements'], orders: ['customerId','dressType','fabricType','orderDate','trialDate','deliveryDate','status','assignedTo','amount','balanceAmount','notes'], payments: ['orderId','customerId','amount','paymentMethod','paymentDate','status','notes'], inventory: ['name','category','sku','quantity','unit','minStockLevel','unitPrice','supplier','status','lastRestocked','notes'], users: ['name','email','password','phone','address','role','roleId','status'], roles: ['name','displayName','description','permissions','modules'] }[table];
    const data = Object.fromEntries([...Object.entries(input), ...Object.entries(aliases)].filter(([key, value]) => allowed.includes(key) && value !== undefined));
    if (table === 'users' && data.password) data.password = bcrypt.hashSync(data.password, 10);
    if (table === 'customers' && data.measurements) data.measurements = JSON.stringify(data.measurements);
    if (table === 'roles') { if (data.permissions) data.permissions = JSON.stringify(data.permissions); if (data.modules) data.modules = JSON.stringify(data.modules); }
    if (table === 'inventory' && data.quantity !== undefined) data.status = Number(data.quantity) <= Number(data.minStockLevel ?? 10) ? 'Low Stock' : 'In Stock';
    const keys = Object.keys(data); db.prepare(`UPDATE ${table} SET ${keys.map(key => `${key}=?`).join(',')} WHERE id=?`).run(...keys.map(key => data[key]), id(req.params.id));
    const item = byId(table, req.params.id);
    const responseItem = table === 'users' ? publicUser(item) : item;
    const email = await sendEntityEventEmail(`${eventName}.updated`, table, responseItem);
    res.json({ data: responseItem, email });
  }, res));
  app.delete(`/api/${path}/:id`, auth, (req, res) => safe(() => { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id(req.params.id)); res.json({ data: { message: `${singular} deleted` } }); }, res));
}
resource({ path: 'customers', table: 'customers', singular: 'Customer', wrapper: 'customers' });
resource({ path: 'orders', table: 'orders', singular: 'Order', wrapper: 'orders' });
resource({ path: 'payments', table: 'payments', singular: 'Payment', wrapper: 'payments' });
resource({ path: 'inventory', table: 'inventory', singular: 'Inventory item', wrapper: 'inventory' });
resource({ path: 'users', table: 'users', singular: 'User', wrapper: 'users' });
resource({ path: 'roles', table: 'roles', singular: 'Role', wrapper: 'roles' });

app.post('/api/customers/:id/measurements', auth, (req, res) => safe(async () => { db.prepare('UPDATE customers SET measurements=? WHERE id=?').run(JSON.stringify(req.body), id(req.params.id)); const item = byId('customers', req.params.id); const email = await sendEntityEventEmail('customer.measurementsUpdated', 'customers', item); res.json({ data: item, email }); }, res));
app.get('/api/customers/:id/orders', auth, (req, res) => res.json({ data: rows('orders', 'WHERE customerId=?', [id(req.params.id)]) }));
app.patch('/api/orders/:id/status', auth, (req, res) => safe(async () => { db.prepare('UPDATE orders SET status=?,notes=COALESCE(?,notes) WHERE id=?').run(req.body.status, req.body.notes, id(req.params.id)); const item = byId('orders', req.params.id); const email = await sendEntityEventEmail('order.statusChanged', 'orders', item); res.json({ data: item, email }); }, res));
app.patch('/api/orders/:id/assign', auth, (req, res) => safe(async () => { db.prepare('UPDATE orders SET assignedTo=? WHERE id=?').run(req.body.staffId, id(req.params.id)); const item = byId('orders', req.params.id); const email = await sendEntityEventEmail('order.assigned', 'orders', item); res.json({ data: item, email }); }, res));
app.patch('/api/inventory/:id/quantity', auth, (req, res) => safe(async () => { db.prepare("UPDATE inventory SET quantity=?,status=CASE WHEN ? <= minStockLevel THEN 'Low Stock' ELSE 'In Stock' END,lastRestocked=? WHERE id=?").run(Number(req.body.quantity), Number(req.body.quantity), today(), id(req.params.id)); const item = byId('inventory', req.params.id); const email = await sendEntityEventEmail('inventory.quantityUpdated', 'inventory', item); res.json({ data: item, email }); }, res));
app.patch('/api/users/:id/status', auth, (req, res) => safe(async () => { db.prepare("UPDATE users SET status=CASE WHEN status='active' THEN 'inactive' ELSE 'active' END WHERE id=?").run(id(req.params.id)); const item = publicUser(byId('users', req.params.id)); const email = await sendEntityEventEmail('user.statusChanged', 'users', item); res.json({ data: item, email }); }, res));
app.get('/api/users/stats/:id', auth, (req, res) => { const user = byId('users', req.params.id); const orders = user?.role === 'owner' ? rows('orders') : rows('orders', 'WHERE assignedTo=?', [user?.name]); res.json({ data: { totalOrders: orders.length, completedOrders: orders.filter(o => o.status === 'Delivered').length, pendingOrders: orders.filter(o => o.status !== 'Delivered').length, totalCustomers: rows('customers').length, totalRevenue: db.prepare('SELECT COALESCE(SUM(amount),0) value FROM payments').get().value } }); });
app.get('/api/inventory/low-stock', auth, (req, res) => res.json({ data: rows('inventory', 'WHERE quantity <= minStockLevel') }));
app.get('/api/dashboard/owner', auth, (req, res) => { const orders = rows('orders'); const customers = rows('customers'); const payments = rows('payments'); const inventory = rows('inventory'); const revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0); const statusCounts = [...new Set(orders.map(order => order.status))].map(name => ({ name, value: orders.filter(order => order.status === name).length })); const revenueChart = [...new Set(payments.map(payment => payment.paymentDate.slice(0, 7)))].sort().map(month => ({ month, revenue: payments.filter(payment => payment.paymentDate.startsWith(month)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0) })); res.json({ data: { revenue: { today: revenue, thisWeek: revenue, thisMonth: revenue, thisYear: revenue }, orders: { total: orders.length, pending: orders.filter(o => o.status === 'New').length, inProgress: orders.filter(o => !['New','Delivered'].includes(o.status)).length, completed: orders.filter(o => o.status === 'Delivered').length }, customers: { total: customers.length, new: customers.length, active: customers.length }, payments: { pending: orders.reduce((sum, o) => sum + Number(o.balanceAmount || 0), 0), overdue: 0, received: revenue }, recentOrders: orders.slice(-5).reverse(), lowStockItems: inventory.filter(i => i.quantity <= i.minStockLevel), upcomingDueDates: orders.filter(o => o.status !== 'Delivered').slice(0, 5), revenueChart, orderStatusChart: statusCounts } }); });
app.get('/api/dashboard/staff', auth, (req, res) => { const orders = rows('orders', 'WHERE assignedTo=?', [req.user.name]); res.json({ data: { myOrders: orders, pending: orders.filter(o => o.status === 'New').length, inProgress: orders.filter(o => o.status !== 'New' && o.status !== 'Delivered').length, completed: orders.filter(o => o.status === 'Delivered').length, upcomingDueDates: orders.filter(o => o.status !== 'Delivered') } }); });
app.get('/api/dashboard/reports', auth, (req, res) => { const orders = rows('orders'); const payments = rows('payments'); const customers = rows('customers'); const inventory = rows('inventory'); res.json({ data: { summary: { totalOrders: orders.length, totalCustomers: customers.length, totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), inventoryValue: inventory.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0) }, orders, payments, customers, inventory } }); });
app.listen(port, () => console.log(`Boutique API listening on http://localhost:${port}`));
