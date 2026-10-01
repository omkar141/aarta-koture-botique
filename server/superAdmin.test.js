const crypto = require('crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('./db');
const { registerSuperAdminRoutes } = require('./superAdmin');

const routes = new Map();
const app = {
  get: (path, ...handlers) => routes.set(`GET ${path}`, handlers.at(-1)),
  post: (path, ...handlers) => routes.set(`POST ${path}`, handlers.at(-1)),
  put: (path, ...handlers) => routes.set(`PUT ${path}`, handlers.at(-1))
};
const pass = (req, res, next) => next();
const safe = (handler, res) => {
  try { handler(); }
  catch (error) { res.status(400).json({ message: error.message }); }
};
registerSuperAdminRoutes(app, { auth: pass, superAdminOnly: pass, safe });

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('assigns existing boutique data and tenant accounts to the default tenant', () => {
  const tenant = db.prepare('SELECT id FROM tenants WHERE slug=?').get('aarta-kouture');
  assert.ok(tenant);
  for (const table of ['roles', 'customers', 'orders', 'payments', 'inventory']) {
    assert.equal(db.prepare(`SELECT COUNT(*) count FROM ${table} WHERE tenantId IS NULL`).get().count, 0, `${table} has records without a tenant`);
  }
  assert.equal(db.prepare("SELECT COUNT(*) count FROM users WHERE tenantId IS NULL AND role!='super_admin'").get().count, 0);
  assert.ok(db.prepare('SELECT 1 FROM users WHERE email=? AND tenantId=?').get('admin@boutique.com', tenant.id));
});

test('provisions a tenant admin with platform-assigned role policies atomically', () => {
  const email = `platform-test-${crypto.randomUUID()}@example.invalid`;
  const rollbackProvision = db.transaction(() => {
    const res = response();
    routes.get('POST /api/super-admin/tenants')({ body: {
      name: 'Platform Test Boutique',
      admin: { name: 'Tenant Admin', email, password: 'temporary-password-2026' },
      roles: [
        { name: 'owner', displayName: 'Tenant Admin', modules: ['dashboard', 'customers'], permissions: ['read', 'create'] },
        { name: 'staff', displayName: 'Staff', modules: ['customers'], permissions: ['read'] }
      ]
    } }, res);

    assert.equal(res.statusCode, 201);
    const tenant = db.prepare('SELECT * FROM tenants WHERE id=?').get(res.body.data.id);
    const admin = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const ownerRole = db.prepare('SELECT * FROM roles WHERE id=?').get(admin.roleId);
    assert.equal(tenant.name, 'Platform Test Boutique');
    assert.equal(admin.tenantId, tenant.id);
    assert.equal(admin.role, 'owner');
    assert.equal(ownerRole.tenantId, tenant.id);
    assert.deepEqual(JSON.parse(ownerRole.modules), ['dashboard', 'customers']);
    assert.deepEqual(JSON.parse(ownerRole.permissions), ['read', 'create']);
    throw new Error('rollback tenant fixture');
  });

  assert.throws(() => rollbackProvision(), /rollback tenant fixture/);
  assert.equal(db.prepare('SELECT 1 FROM users WHERE email=?').get(email), undefined);
});
