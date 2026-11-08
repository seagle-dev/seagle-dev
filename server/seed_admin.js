require('dotenv').config();
const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  try {
    // Hash the password defined in your .env
    if (!process.env.AUTO_LOGIN_PASSWORD || !process.env.AUTO_LOGIN_EMAIL) {
      throw new Error('Set AUTO_LOGIN_EMAIL and AUTO_LOGIN_PASSWORD before seeding an admin.');
    }
    const hash = await bcrypt.hash(process.env.AUTO_LOGIN_PASSWORD, 10);
    const adminEmail = process.env.AUTO_LOGIN_EMAIL;
    
    const { rowCount } = await db.query(
      "UPDATE users SET password_hash = $1, role = 'admin', first_name = 'System', last_name = 'Admin' WHERE email = $2",
      [hash, adminEmail]
    );

    if (rowCount === 0) {
      await db.query(
        "INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, 'admin', 'System', 'Admin')",
        [adminEmail, hash]
      );
    }

    console.log(rowCount === 0 ? 'Admin user created.' : 'Admin user password updated.');
  } catch (err) {
    console.error('DB Error:', err);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

seedAdmin();
