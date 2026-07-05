const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require('../config/firebase');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
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
      const { rows: insertRows } = await db.query(
        "INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [email, hash, defaultRole, firstName || '', lastName || '']
      );
      const userId = insertRows[0].id;
      console.log('DB insert result:', userId);

      const userObj = { id: userId, email, firstName: firstName || '', lastName: lastName || '', role: defaultRole };
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });

      return res.status(201).json({ token, user: userObj });
    } catch (dbErr) {
      console.error('DB error:', dbErr.code, dbErr.message);
      if (firebaseUser && firebaseUser.uid) {
        try { await admin.auth().deleteUser(firebaseUser.uid); } catch (_) {}
      }
      if (dbErr.code === "23505") return res.status(400).json({ message: "User already exists" });
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

      const { rows: results } = await db.query("SELECT * FROM users WHERE email = $1", [fEmail]);
      const defaultRole = 'learner';

      if (results && results.length > 0) {
        const user = results[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
        return res.json({ token, user: { id: user.id, email: user.email } });
      }

      const { rows: insertRows } = await db.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
        [fEmail, '', defaultRole]
      );
      const newId = insertRows[0].id;
      const token = jwt.sign({ id: newId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
      return res.json({ token, user: { id: newId, email: fEmail } });
    } catch (err) {
      return res.status(401).json({ message: "Invalid Firebase token", error: err.message });
    }
  }

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const { rows: results } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
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

    const { rows: results } = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (results && results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
      return res.json({ token, user: { id: user.id, email: user.email } });
    }

    const { rows: insertRows } = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
      [email, '', defaultRole]
    );
    const newId = insertRows[0].id;
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

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [devEmail]);
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
    const { rows } = await db.query(
      'SELECT id, email, role, first_name, last_name, username, department, course, year_level, classes_enrolled, classes_completed FROM users WHERE id = $1 LIMIT 1',
      [req.user.id],
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      department: user.department,
      course: user.course,
      yearLevel: user.year_level,
      classesEnrolled: user.classes_enrolled,
      classesCompleted: user.classes_completed,
    });
  } catch (err) {
    console.error('auth.profile error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { firstName, lastName, username } = req.body;
  
  try {
    await db.query(
      "UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE id = $4",
      [firstName || '', lastName || '', username || '', req.user.id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error('updateProfile error', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both current and new password are required" });
  }

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ message: "Account uses external authentication and cannot change password here." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error('changePassword error', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows && rows.length > 0) {
      const user = rows[0];
      if (user.password_hash) {
        // Local DB user: Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Delete any existing OTPs for this email to prevent spam
        await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

        // Save new OTP
        await db.query(
          "INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, $3)",
          [email, otp, expiresAt]
        );

        console.log(`[DEBUG] OTP for ${email} is ${otp}`);

        // Try to send email with Resend
        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: 'Seagle App <onboarding@resend.dev>', // Use verified domain in prod
              to: [email],
              subject: 'Your Password Reset Code',
              html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`,
            });
            console.log('OTP email sent to', email);
          } catch (emailErr) {
            console.error('Failed to send OTP email:', emailErr);
          }
        } else {
          console.warn('No RESEND_API_KEY set. Check server logs for the OTP.');
        }
      }
    }
    
    // Always return success to prevent email enumeration
    res.json({ message: "If an account exists, a reset code has been sent." });
  } catch (err) {
    console.error('forgotPassword error', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }

  try {
    // Find the OTP record
    const { rows: resetRows } = await db.query(
      "SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND expires_at > NOW()",
      [email, otp]
    );

    if (!resetRows || resetRows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Verify the user exists
    const { rows: userRows } = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userRows[0].id;

    // Hash the new password and update the user
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, userId]);

    // Delete the used OTP
    await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

    res.json({ message: "Password has been successfully reset" });
  } catch (err) {
    console.error('resetPassword error', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
