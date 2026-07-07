require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  try {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    
    // Hash the password defined in your .env
    const hash = await bcrypt.hash(process.env.AUTO_LOGIN_PASSWORD || 'Wachichaw.edu1', 10);
    const adminEmail = process.env.AUTO_LOGIN_EMAIL || 'admin';
    
    await pool.query(
      "INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, 'admin', 'System', 'Admin')",
      [adminEmail, hash]
    );
    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

seedAdmin();
