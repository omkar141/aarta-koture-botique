const { db } = require('./db');

const tables = ['users', 'roles', 'customers', 'orders', 'payments', 'inventory'];
for (const table of tables) {
  const rows = db.prepare(`SELECT * FROM ${table} LIMIT 20`).all();
  console.log(`\n## ${table}`);
  console.table(rows);
}
