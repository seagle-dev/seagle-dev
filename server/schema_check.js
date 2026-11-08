require('dotenv').config();
const db = require('./src/config/db');

async function getColumns() {
  try {
    const { rows } = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 ORDER BY ordinal_position",
      ['users']
    );
    console.log(rows.map(r => r.column_name));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
getColumns();
