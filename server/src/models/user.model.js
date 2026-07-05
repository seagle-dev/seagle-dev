const db = require('../config/db');

module.exports = {
  createUser: async (email, password_hash) => {
    const defaultRole = 'learner';
    const { rows } = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
      [email, password_hash, defaultRole]
    );
    return { insertId: rows[0].id };
  },

  findById: async (id) => {
    const { rows } = await db.query(
      "SELECT id, email FROM users WHERE id = $1",
      [id]
    );
    return rows;
  },

  findByEmail: async (email) => {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return rows;
  }
};