require('dotenv').config();
const db = require('./src/config/db');

async function createResetsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('password_resets table created or already exists.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
createResetsTable();