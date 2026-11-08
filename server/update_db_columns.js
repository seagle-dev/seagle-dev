require('dotenv').config();
const db = require('./src/config/db');

async function updateDb() {
  try {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT ''");
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) DEFAULT ''");
    console.log('Columns added');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
updateDb();
