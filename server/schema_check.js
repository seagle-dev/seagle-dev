require('dotenv').config();
const db = require('./src/config/db');

async function getColumns() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM users");
    console.log(rows.map(r => r.Field));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
getColumns();