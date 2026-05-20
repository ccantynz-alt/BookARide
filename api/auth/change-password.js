/**
 * POST /api/auth/change-password
 *
 * Change the password for the currently-logged-in admin. Requires the
 * current password to be supplied AND verified.
 *
 * Body: { current_password, new_password }
 */
const { findOne, updateOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function verifyPbkdf2Sha256(password, hashStr) {
  try {
    const parts = hashStr.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') return false;
    const rounds = parseInt(parts[2], 10);
    const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const salt = Buffer.from(pad(parts[3].replace(/\./g, '+')), 'base64');
    const expected = Buffer.from(pad(parts[4].replace(/\./g, '+')), 'base64');
    const derived = crypto.pbkdf2Sync(password, salt, rounds, expected.length, 'sha256');
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

async function verifyPassword(password, hashed) {
  if (!hashed) return false;
  if (hashed.startsWith('$pbkdf2-sha256$')) return verifyPbkdf2Sha256(password, hashed);
  if (hashed.startsWith('$2b$') || hashed.startsWith('$2a$')) return bcrypt.compare(password, hashed);
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const decoded = verifyAdmin(req, res);
  if (!decoded) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ detail: 'current_password and new_password are required' });
    }
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return res.status(400).json({ detail: 'new_password must be at least 8 characters' });
    }

    const username = decoded.sub;
    const admin = await findOne('admin_users', { username });
    if (!admin) return res.status(404).json({ detail: 'Admin user not found' });

    const stored = admin.hashed_password || admin.password;
    const ok = await verifyPassword(current_password, stored);
    if (!ok) return res.status(401).json({ detail: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    await updateOne('admin_users', { username }, {
      $set: {
        hashed_password: hashed,
        password_updated_at: new Date().toISOString(),
      },
    });

    console.error(`Admin ${username} changed password`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('change-password error:', err.message);
    return res.status(500).json({ detail: 'Failed to change password' });
  }
};
