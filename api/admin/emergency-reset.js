/**
 * POST /api/admin/emergency-reset
 * TEMPORARY emergency password reset — no email required.
 * Sets a new password directly if you provide the admin username + new password.
 * DELETE THIS FILE after use.
 */
const { findOne, updateOne } = require('../_lib/db');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { username, new_password } = req.body;
    if (!username || !new_password) {
      return res.status(400).json({ detail: 'Username and new_password required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters' });
    }

    // Find admin user
    const admin = await findOne('admin_users', { username });
    if (!admin) {
      return res.status(404).json({ detail: 'Admin user not found' });
    }

    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update password
    await updateOne('admin_users', { username }, {
      $set: {
        hashed_password: hashedPassword,
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      message: `Password reset for ${username}. You can now log in.`,
    });
  } catch (err) {
    console.error('Emergency reset error:', err.message);
    return res.status(500).json({ detail: 'Reset failed: ' + err.message });
  }
};
