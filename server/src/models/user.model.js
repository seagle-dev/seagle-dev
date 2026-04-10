const db = require('../config/db');

module.exports = {
  createUser: async (email, password_hash) => {
    const defaultRole = 'learner';
    const [result] = await db.execute(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, password_hash, defaultRole]
    );
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      "SELECT id, email FROM users WHERE id = ?",
      [id]
    );
    return rows;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows;
  }
};