/**
 * POST /api/admin/set-password
 *
 * Sets the password for the currently-logged-in admin user. Does NOT
 * require the current password (use /api/auth/change-password for that).
 * Intended for the "Set initial password" flow when an admin first
 * logs in via OAuth or magic link.
 *
 * Body: { new_password }
 */
const { findOne, updateOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const decoded = verifyAdmin(req, res);
  if (!decoded) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { new_password } = req.body || {};
    if (!new_password || typeof new_password !== 'string' || new_password.length < 8) {
      return res.status(400).json({ detail: 'new_password must be at least 8 characters' });
    }

    const username = decoded.sub;
    const admin = await findOne('admin_users', { username });
    if (!admin) return res.status(404).json({ detail: 'Admin user not found' });

    const hashed = await bcrypt.hash(new_password, 10);
    await updateOne('admin_users', { username }, {
      $set: {
        hashed_password: hashed,
        password_updated_at: new Date().toISOString(),
      },
    });

    console.error(`Admin ${username} set new password`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('set-password error:', err.message);
    return res.status(500).json({ detail: 'Failed to set password' });
  }
};
