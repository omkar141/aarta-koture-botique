const bcrypt = require('bcryptjs');
const { db } = require('./db');

const allowedModules = new Set(['dashboard', 'customers', 'orders', 'payments', 'inventory', 'reports', 'users', 'roles']);
const allowedPermissions = new Set(['read', 'create', 'update', 'delete', 'all']);
const slugify = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const validateRoles = roles => {
  if (!Array.isArray(roles) || !roles.some(role => role.name === 'owner')) throw new Error('Tenant roles must include an owner role');
  return roles.map(role => {
    const name = slugify(role.name);
    const modules = [...new Set(role.modules || [])];
    const permissions = [...new Set(role.permissions || [])];
    if (!name || name === 'super-admin') throw new Error('Invalid tenant role name');
    if (modules.some(module => !allowedModules.has(module))) throw new Error(`Invalid module in ${name} role`);
    if (permissions.some(permission => !allowedPermissions.has(permission))) throw new Error(`Invalid permission in ${name} role`);
    return { name, displayName: String(role.displayName || name).trim(), description: String(role.description || ''), modules, permissions };
  });
};

const roleStatements = {
  upsert: db.prepare(`INSERT INTO roles (name,displayName,description,permissions,modules,tenantId,createdAt)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(tenantId,name) DO UPDATE SET displayName=excluded.displayName,
    description=excluded.description,permissions=excluded.permissions,modules=excluded.modules`),
  list: db.prepare('SELECT id,name,displayName,description,permissions,modules FROM roles WHERE tenantId=? ORDER BY id'),
  admin: db.prepare("SELECT id,name,email,status,lastLogin FROM users WHERE tenantId=? AND role='owner' ORDER BY id LIMIT 1")
};

const registerSuperAdminRoutes = (app, { auth, superAdminOnly, safe }) => {
  app.get('/api/super-admin/tenants', auth, superAdminOnly, (req, res) => safe(() => {
    const tenants = db.prepare('SELECT * FROM tenants ORDER BY createdAt DESC').all().map(tenant => ({
      ...tenant,
      admin: roleStatements.admin.get(tenant.id) || null,
      roles: roleStatements.list.all(tenant.id).map(role => ({
        ...role,
        modules: JSON.parse(role.modules || '[]'),
        permissions: JSON.parse(role.permissions || '[]')
      }))
    }));
    res.json({ data: tenants });
  }, res));

  app.post('/api/super-admin/tenants', auth, superAdminOnly, (req, res) => safe(() => {
    const { name, admin } = req.body || {};
    const tenantName = String(name || '').trim();
    const email = String(admin?.email || '').trim().toLowerCase();
    const password = String(admin?.password || '');
    if (tenantName.length < 2) throw new Error('Tenant name must be at least 2 characters');
    if (String(admin?.name || '').trim().length < 2) throw new Error('Tenant admin name must be at least 2 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid tenant admin email');
    if (password.length < 12) throw new Error('Tenant admin password must be at least 12 characters');
    const roles = validateRoles(req.body.roles);
    const ownerRole = roles.find(role => role.name === 'owner');
    const slugBase = slugify(req.body.slug || tenantName) || `tenant-${Date.now()}`;
    let slug = slugBase;
    let suffix = 2;
    while (db.prepare('SELECT 1 FROM tenants WHERE slug=?').get(slug)) slug = `${slugBase}-${suffix++}`;

    const createTenant = db.transaction(() => {
      const createdAt = new Date().toISOString();
      const tenantId = Number(db.prepare('INSERT INTO tenants (name,slug,status,createdAt) VALUES (?,?,?,?)')
        .run(tenantName, slug, 'active', createdAt).lastInsertRowid);
      for (const role of roles) {
        roleStatements.upsert.run(role.name, role.displayName, role.description, JSON.stringify(role.permissions), JSON.stringify(role.modules), tenantId, createdAt);
      }
      const owner = db.prepare('SELECT id FROM roles WHERE tenantId=? AND name=?').get(tenantId, ownerRole.name);
      db.prepare('INSERT INTO users (name,email,password,phone,address,role,roleId,tenantId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(String(admin.name || '').trim(), email, bcrypt.hashSync(password, 12), admin.phone || '', admin.address || '', ownerRole.name, owner.id, tenantId, 'active', createdAt);
      return tenantId;
    });
    const tenantId = createTenant();
    const tenant = db.prepare('SELECT * FROM tenants WHERE id=?').get(tenantId);
    res.status(201).json({ data: { ...tenant, admin: roleStatements.admin.get(tenantId) } });
  }, res));

  app.put('/api/super-admin/tenants/:id', auth, superAdminOnly, (req, res) => safe(() => {
    const tenantId = Number.parseInt(req.params.id, 10);
    const current = db.prepare('SELECT * FROM tenants WHERE id=?').get(tenantId);
    if (!current) throw new Error('Tenant not found');
    const roles = validateRoles(req.body.roles);
    const tenantName = String(req.body.name ?? current.name).trim();
    const status = req.body.status ?? current.status;
    if (tenantName.length < 2 || !['active', 'inactive'].includes(status)) throw new Error('Invalid tenant details');
    db.transaction(() => {
      db.prepare('UPDATE tenants SET name=?,status=? WHERE id=?').run(tenantName, status, tenantId);
      for (const role of roles) {
        roleStatements.upsert.run(role.name, role.displayName, role.description, JSON.stringify(role.permissions), JSON.stringify(role.modules), tenantId, current.createdAt);
      }
      const keep = new Set(roles.map(role => role.name));
      for (const role of roleStatements.list.all(tenantId)) {
        if (keep.has(role.name)) continue;
        if (db.prepare('SELECT 1 FROM users WHERE tenantId=? AND roleId=?').get(tenantId, role.id)) throw new Error(`Reassign users before removing the ${role.displayName} role`);
        db.prepare('DELETE FROM roles WHERE tenantId=? AND id=?').run(tenantId, role.id);
      }
    })();
    res.json({ data: { ...db.prepare('SELECT * FROM tenants WHERE id=?').get(tenantId), admin: roleStatements.admin.get(tenantId) } });
  }, res));
};

module.exports = { registerSuperAdminRoutes };
