/**
 * POST /api/admin/login
 * Admin login — returns JWT token.
 * Replaces: Python backend POST /api/admin/login
 */
const { findOne } = require('../_lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password required' });
    }

    // Find admin user
    const admin = await findOne('admin_users', { username });
    if (!admin) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      console.error('JWT_SECRET_KEY not configured');
      return res.status(500).json({ detail: 'Authentication not configured' });
    }

    const token = jwt.sign(
      { sub: admin.username, admin_id: admin.id },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: 'Login failed' });
  }
};
