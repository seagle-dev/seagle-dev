const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.register = async (req, res) => {
  const { email, password } = req.body;
  console.log('Register called with email:', email);
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    let firebaseUser = null;
    try {
      firebaseUser = await admin.auth().createUser({ email, password });
      console.log('Firebase user created:', firebaseUser.uid);
    } catch (fbErr) {
      console.log('Firebase error:', fbErr.code, fbErr.message);
      if (fbErr.code !== 'auth/email-already-exists') {
        return res.status(500).json({ message: "Firebase error", error: fbErr.message });
      }
    }

    const defaultRole = 'learner';

    try {
      const [result] = await db.execute(
        "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        [email, hash, defaultRole]
      );
      console.log('DB insert result:', result.insertId);

      const userId = result.insertId;
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });

      return res.status(201).json({ token, user: { id: userId, email } });
    } catch (dbErr) {
      console.error('DB error:', dbErr.code, dbErr.message);
      if (firebaseUser && firebaseUser.uid) {
        try { await admin.auth().deleteUser(firebaseUser.uid); } catch (_) {}
      }
      if (dbErr.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "User already exists" });
      return res.status(500).json({ message: "DB error", error: dbErr.message });
    }
  } catch (err) {
    console.error('Register top-level error:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, idToken } = req.body;

  if (idToken) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const fEmail = decoded.email;
      if (!fEmail) return res.status(400).json({ message: "Firebase token has no email" });

      const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [fEmail]);
      const defaultRole = 'learner';

      if (results && results.length > 0) {
        const user = results[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
        return res.json({ token, user: { id: user.id, email: user.email } });
      }

      const [insertRes] = await db.execute(
        "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        [fEmail, '', defaultRole]
      );
      const newId = insertRes.insertId;
      const token = jwt.sign({ id: newId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
      return res.json({ token, user: { id: newId, email: fEmail } });
    } catch (err) {
      return res.status(401).json({ message: "Invalid Firebase token", error: err.message });
    }
  }

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!results || results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];
    if (!user.password_hash) return res.status(401).json({ message: "Account uses Firebase authentication. Sign in with Firebase." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.firebaseAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "idToken required" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return res.status(400).json({ message: "Firebase token has no email" });

    const defaultRole = 'learner';

    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (results && results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
      return res.json({ token, user: { id: user.id, email: user.email } });
    }

    const [insertRes] = await db.execute(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, '', defaultRole]
    );
    const newId = insertRes.insertId;
    const token = jwt.sign({ id: newId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
    return res.json({ token, user: { id: newId, email } });
  } catch (err) {
    return res.status(401).json({ message: "Invalid Firebase token", error: err.message });
  }
};

exports.autoLogin = async (req, res) => {
  try {
    const devEmail = process.env.AUTO_LOGIN_EMAIL;
    const devPassword = process.env.AUTO_LOGIN_PASSWORD;
    console.log('auth.autoLogin called, AUTO_LOGIN_EMAIL=', devEmail ? devEmail : undefined);

    if (!devEmail || !devPassword) {
      return res.status(400).json({ message: 'AUTO_LOGIN_EMAIL and AUTO_LOGIN_PASSWORD must be set in .env' });
    }

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [devEmail]);
    console.log('auth.autoLogin DB rows length=', rows?.length || 0);

    if (!rows || rows.length === 0) {
      console.warn('auth.autoLogin account not found for', devEmail);
      return res.status(404).json({ message: 'Auto-login account not found' });
    }

    const user = rows[0];
    if (!user.password_hash) {
      console.warn('auth.autoLogin user has no password_hash stored', { email: devEmail });
      return res.status(401).json({ message: 'User has no password set' });
    }

    const match = await bcrypt.compare(devPassword, user.password_hash);
    if (!match) {
      console.warn('auth.autoLogin password mismatch for', devEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    console.log('auth.autoLogin issuing token (masked)=', token?.slice?.(0,8) + '...');
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('auth.autoLogin error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refreshToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token: newToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.profile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id],
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('auth.profile error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
