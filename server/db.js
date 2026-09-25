require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'boutique.sqlite'));
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, phone TEXT, address TEXT, role TEXT NOT NULL DEFAULT 'staff', roleId INTEGER, status TEXT NOT NULL DEFAULT 'active', lastLogin TEXT, createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, displayName TEXT, description TEXT, permissions TEXT NOT NULL DEFAULT '[]', modules TEXT NOT NULL DEFAULT '[]', createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, customerId TEXT NOT NULL UNIQUE, name TEXT NOT NULL, email TEXT, phone TEXT, address TEXT, dateAdded TEXT NOT NULL, measurements TEXT NOT NULL DEFAULT '{}');
  CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId TEXT NOT NULL UNIQUE, customerId INTEGER NOT NULL, dressType TEXT, fabricType TEXT, orderDate TEXT NOT NULL, trialDate TEXT, deliveryDate TEXT, status TEXT NOT NULL DEFAULT 'New', assignedTo TEXT, amount REAL NOT NULL DEFAULT 0, balanceAmount REAL NOT NULL DEFAULT 0, notes TEXT, FOREIGN KEY(customerId) REFERENCES customers(id) ON DELETE RESTRICT);
  CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER, customerId INTEGER, customerName TEXT, amount REAL NOT NULL, paymentMethod TEXT, paymentDate TEXT NOT NULL, status TEXT NOT NULL, transactionId TEXT NOT NULL UNIQUE, notes TEXT, FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE SET NULL, FOREIGN KEY(customerId) REFERENCES customers(id) ON DELETE SET NULL);
  CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, sku TEXT UNIQUE, quantity REAL NOT NULL DEFAULT 0, unit TEXT, minStockLevel REAL NOT NULL DEFAULT 10, unitPrice REAL NOT NULL DEFAULT 0, supplier TEXT, status TEXT NOT NULL, lastRestocked TEXT, notes TEXT);
`);

const now = new Date().toISOString();
const today = () => now.slice(0, 10);
if (db.prepare('SELECT COUNT(*) count FROM customers').get().count === 0) {
  const customer = db.prepare('INSERT INTO customers (customerId,name,email,phone,address,dateAdded,measurements) VALUES (?,?,?,?,?,?,?)');
  customer.run('CUST001', 'John Doe', 'john@example.com', '+91 9876543210', '123 Main St, City, State', '2024-01-15', JSON.stringify({ shoulder: 15.5, bust: 38, waist: 32, hip: 36, sleeveLength: 22, dressLength: 40, notes: 'Prefers slim fit' }));
  customer.run('CUST002', 'Jane Smith', 'jane@example.com', '+91 8765432109', '456 Oak Ave, City, State', '2024-01-20', JSON.stringify({ shoulder: 14, bust: 34, waist: 26, hip: 36, sleeveLength: 20, dressLength: 38, notes: 'Allergic to wool' }));
  customer.run('CUST003', 'Bob Johnson', 'bob@example.com', '+91 7654321098', '789 Pine Rd, City, State', '2024-02-01', JSON.stringify({ shoulder: 16, bust: 42, waist: 36, hip: 40, sleeveLength: 24, dressLength: 42, notes: 'Prefers loose fit' }));
  const order = db.prepare('INSERT INTO orders (orderId,customerId,dressType,fabricType,orderDate,trialDate,deliveryDate,status,assignedTo,amount,balanceAmount,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  order.run('ORD001', 1, 'Suit', 'Wool', '2024-02-10', '2024-02-25', '2024-03-10', 'In Stitching', 'Tailor A', 1200, 600, 'Navy blue suit with silk lining.');
  order.run('ORD002', 2, 'Gown', 'Satin', '2024-02-15', '2024-03-01', '2024-03-20', 'New', '', 800, 400, 'Red evening gown with sequins.');
  order.run('ORD003', 3, 'Trouser', 'Cotton', '2024-01-25', '2024-02-01', '2024-02-05', 'Delivered', 'Tailor B', 150, 0, 'Pants hemming and jacket fitting.');
  const inventory = db.prepare('INSERT INTO inventory (name,category,sku,quantity,unit,minStockLevel,unitPrice,supplier,status,lastRestocked,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  inventory.run('Premium Wool Fabric', 'Fabric', 'FAB001', 50, 'meters', 20, 45, 'Fabric Wholesalers Inc', 'In Stock', '2024-02-01', 'Navy blue, suitable for suits');
  inventory.run('Silk Thread', 'Supplies', 'SUP001', 15, 'spools', 25, 8, 'Thread Masters', 'Low Stock', '2024-01-15', 'Various colors available');
  inventory.run('Buttons (Gold)', 'Accessories', 'ACC001', 200, 'pieces', 50, 2, 'Button Emporium', 'In Stock', '2024-02-10', 'Premium gold-plated buttons');
}
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id,name,displayName,description,permissions,modules,createdAt) VALUES (?,?,?,?,?,?,?)');
insertRole.run(1, 'owner', 'Owner', 'Full system access', JSON.stringify(['all']), JSON.stringify(['dashboard','customers','orders','payments','inventory','reports','users','roles']), now);
insertRole.run(2, 'staff', 'Staff', 'Limited access to operations', JSON.stringify(['read','create','update']), JSON.stringify(['dashboard','customers','orders','inventory']), now);
insertRole.run(3, 'accountant', 'Accountant', 'Financial management access', JSON.stringify(['read','create','update']), JSON.stringify(['dashboard','payments','reports']), now);
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id,name,email,password,phone,address,role,roleId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)');
insertUser.run(1, 'Admin User', 'admin@boutique.com', bcrypt.hashSync('Aarta#Owner2026!', 10), '+91 9876543210', '123 Admin Street, City', 'owner', 1, 'active', now);
insertUser.run(2, 'Staff User', 'staff@boutique.com', bcrypt.hashSync('staff123', 10), '+91 8765432109', '456 Staff Avenue, City', 'staff', 2, 'active', now);
insertUser.run(3, 'Accountant User', 'accountant@boutique.com', bcrypt.hashSync('accountant123', 10), '+91 7654321098', '789 Finance Road, City', 'accountant', 3, 'active', now);

const customerCount = db.prepare('SELECT COUNT(*) count FROM customers').get().count;
const addCustomer = db.prepare('INSERT OR IGNORE INTO customers (customerId,name,email,phone,address,dateAdded,measurements) VALUES (?,?,?,?,?,?,?)');
for (let index = customerCount + 1; index <= 100; index += 1) addCustomer.run(`CUST${String(index).padStart(3, '0')}`, `Customer ${index}`, `customer${index}@example.com`, `+91 90000000${String(index).padStart(2, '0')}`, `${index} Boutique Street, City`, today(), JSON.stringify({ shoulder: 14 + index % 3, bust: 32 + index, waist: 26 + index, hip: 34 + index, notes: 'Regular customer' }));
const orderCount = db.prepare('SELECT COUNT(*) count FROM orders').get().count;
const addOrder = db.prepare('INSERT OR IGNORE INTO orders (orderId,customerId,dressType,fabricType,orderDate,status,assignedTo,amount,balanceAmount,notes) VALUES (?,?,?,?,?,?,?,?,?,?)');
const customerIds = db.prepare('SELECT id FROM customers ORDER BY id').all().map(customer => customer.id);
for (let index = orderCount + 1; index <= 120; index += 1) addOrder.run(`ORD${String(index).padStart(3, '0')}`, customerIds[(index - 1) % customerIds.length], ['Saree', 'Lehenga', 'Gown', 'Blouse'][index % 4], ['Cotton', 'Silk', 'Satin'][index % 3], today(), index % 4 === 0 ? 'Delivered' : 'New', index % 2 ? 'Staff User' : 'Tailor A', 500 + index * 75, index % 4 === 0 ? 0 : 500 + index * 25, 'Seeded order for testing');
const paymentCount = db.prepare('SELECT COUNT(*) count FROM payments').get().count;
const addPayment = db.prepare('INSERT OR IGNORE INTO payments (orderId,customerId,customerName,amount,paymentMethod,paymentDate,status,transactionId,notes) VALUES (?,?,?,?,?,?,?,?,?)');
for (let index = paymentCount + 1; index <= 120; index += 1) { const order = db.prepare('SELECT id,customerId FROM orders WHERE id=?').get(index); if (order) addPayment.run(order.id, order.customerId, `Customer ${index}`, 100 + index * 25, index % 2 ? 'Cash' : 'UPI', today(), 'Completed', `SEEDTXN${index}`, 'Seeded payment for testing'); }
const inventoryCount = db.prepare('SELECT COUNT(*) count FROM inventory').get().count;
const addInventory = db.prepare('INSERT OR IGNORE INTO inventory (name,category,sku,quantity,unit,minStockLevel,unitPrice,supplier,status,lastRestocked,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
for (let index = inventoryCount + 1; index <= 120; index += 1) { const quantity = index % 3 === 0 ? 5 : 30 + index; const minimum = 10; addInventory.run(`Boutique Item ${index}`, index % 2 ? 'Fabric' : 'Accessories', `SKU${String(index).padStart(3, '0')}`, quantity, index % 2 ? 'meters' : 'pieces', minimum, 10 + index, 'Om Srinivas Suppliers', quantity <= minimum ? 'Low Stock' : 'In Stock', today(), 'Seeded inventory for testing'); }
const roleCount = db.prepare('SELECT COUNT(*) count FROM roles').get().count;
const addRole = db.prepare('INSERT OR IGNORE INTO roles (name,displayName,description,permissions,modules,createdAt) VALUES (?,?,?,?,?,?)');
for (let index = roleCount + 1; index <= 50; index += 1) addRole.run(`role_${index}`, `Role ${index}`, 'Seeded role for testing', JSON.stringify(['read']), JSON.stringify(['dashboard']), now);
const userCount = db.prepare('SELECT COUNT(*) count FROM users').get().count;
for (let index = userCount + 1; index <= 50; index += 1) insertUser.run(index, `Team Member ${index}`, `member${index}@boutique.com`, bcrypt.hashSync('password123', 10), `+91 91111111${String(index).padStart(2, '0')}`, 'Boutique Office', 'staff', 2, 'active', now);

function parseRow(row) {
  if (!row) return row;
  if (row.measurements) row.measurements = JSON.parse(row.measurements);
  if (row.permissions) row.permissions = JSON.parse(row.permissions);
  if (row.modules) row.modules = JSON.parse(row.modules);
  return row;
}
function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}
module.exports = { db, now, parseRow, publicUser };
