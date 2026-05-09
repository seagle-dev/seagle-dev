require('dotenv').config();
const db = require('./src/config/db');

async function updateDb() {
  try {
    await db.query("ALTER TABLE users ADD COLUMN first_name VARCHAR(100) DEFAULT '' AFTER email");
    await db.query("ALTER TABLE users ADD COLUMN last_name VARCHAR(100) DEFAULT '' AFTER first_name");
    console.log('Columns added');
    process.exit(0);
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
       console.log('Columns already exist');
       process.exit(0);
    }
    console.error(e);
    process.exit(1);
  }
}
updateDb();