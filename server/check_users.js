require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAdmin() {
  try {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const [rows] = await pool.query('SELECT id, email, role, password_hash FROM users');
    console.log('--- ALL USERS IN DB ---');
    console.table(rows.map(r => ({ ...r, password_hash: r.password_hash ? '[HIDDEN]' : 'NULL' })));
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

checkAdmin();
