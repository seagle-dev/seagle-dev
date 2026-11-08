require('dotenv').config();
const db = require('./src/config/db');

async function checkAdmin() {
  try {
    const { rows } = await db.query('SELECT id, email, role, password_hash FROM users');
    console.log('--- ALL USERS IN DB ---');
    console.table(rows.map(r => ({ ...r, password_hash: r.password_hash ? '[HIDDEN]' : 'NULL' })));
    await db.pool.end();
  } catch (err) {
    console.error('DB Error:', err);
    await db.pool.end();
    process.exitCode = 1;
  }
}

checkAdmin();
