/**
 * POST /api/admin/login
 * Admin login — returns JWT token.
 * Supports both bcrypt and passlib pbkdf2_sha256 password hashes.
 */
const { findOne } = require('../_lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Verify a password against a passlib pbkdf2_sha256 hash.
 * Format: $pbkdf2-sha256$rounds$salt$hash (using passlib's ab64 encoding)
 */
function verifyPbkdf2Sha256(password, hashStr) {
  try {
    // Parse passlib format: $pbkdf2-sha256$29000$salt$hash
    const parts = hashStr.split('$');
    // parts: ['', 'pbkdf2-sha256', 'rounds', 'salt', 'hash']
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') return false;

    const rounds = parseInt(parts[2], 10);
    // passlib uses a modified base64 (ab64): replace . with + and add padding
    const saltB64 = parts[3].replace(/\./g, '+');
    const hashB64 = parts[4].replace(/\./g, '+');

    // Add padding if needed
    const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const salt = Buffer.from(pad(saltB64), 'base64');
    const expectedHash = Buffer.from(pad(hashB64), 'base64');

    // Derive key using pbkdf2
    const derived = crypto.pbkdf2Sync(password, salt, rounds, expectedHash.length, 'sha256');
    return crypto.timingSafeEqual(derived, expectedHash);
  } catch (err) {
    console.error('pbkdf2 verify error:', err.message);
    return false;
  }
}

/**
 * Verify password against either bcrypt or pbkdf2_sha256 hash.
 */
async function verifyPassword(password, hashedPassword) {
  if (!hashedPassword) return false;

  if (hashedPassword.startsWith('$pbkdf2-sha256$')) {
    return verifyPbkdf2Sha256(password, hashedPassword);
  }
  if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
    return bcrypt.compare(password, hashedPassword);
  }
  return false;
}

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

    // Verify password — field is hashed_password (not password)
    const hashedPassword = admin.hashed_password || admin.password;
    const validPassword = await verifyPassword(password, hashedPassword);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }

    // Check if admin is active
    if (admin.is_active === false) {
      return res.status(401).json({ detail: 'Admin account is disabled' });
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
