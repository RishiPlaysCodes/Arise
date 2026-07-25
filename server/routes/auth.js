const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Simple but secure password hashing using Node's built-in crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, hunterName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    const userId = uuidv4();
    const passwordHash = hashPassword(password);

    // Create user
    db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)').run(
      userId, username, email, passwordHash
    );

    // Create player profile
    db.prepare(`
      INSERT INTO player_profiles (id, user_id, hunter_name, rank, level, experience, experience_to_next_level, title)
      VALUES (?, ?, ?, 'E', 1, 0, 100, 'Weakest Hunter')
    `).run(uuidv4(), userId, hunterName || username);

    // Create player stats
    db.prepare(`
      INSERT INTO player_stats (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), userId);

    const token = generateToken(userId, username);

    res.status(201).json({
      message: 'Hunter registered successfully. Arise!',
      token,
      user: {
        id: userId,
        username,
        email,
        hunterName: hunterName || username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const profile = db.prepare('SELECT * FROM player_profiles WHERE user_id = ?').get(user.id);
    const token = generateToken(user.id, user.username);

    res.json({
      message: 'Welcome back, Hunter.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.userId);
    const profile = db.prepare('SELECT * FROM player_profiles WHERE user_id = ?').get(req.user.userId);
    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(req.user.userId);
    const bodyProfile = db.prepare('SELECT * FROM body_profiles WHERE user_id = ?').get(req.user.userId);

    res.json({ user, profile, stats, bodyProfile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

module.exports = router;
