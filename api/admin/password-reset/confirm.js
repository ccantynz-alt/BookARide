/**
 * POST /api/admin/password-reset/confirm
 * Confirm password reset with token and new password.
 */
const { findOne, updateOne } = require('../../_lib/db');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ detail: 'Token and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters' });
    }

    // Find the reset token
    const tokenDoc = await findOne('password_reset_tokens', { token });
    if (!tokenDoc || tokenDoc.used === true) {
      return res.status(400).json({ detail: 'Invalid or expired reset token' });
    }

    // Check expiry
    const expiresAt = new Date(tokenDoc.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ detail: 'Reset token has expired. Please request a new one.' });
    }

    // Hash new password with bcrypt (compatible with both Python passlib and Node.js)
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update admin password
    await updateOne('admin_users', { username: tokenDoc.username }, {
      $set: {
        hashed_password: hashedPassword,
        updated_at: new Date().toISOString(),
      },
    });

    // Mark token as used
    await updateOne('password_reset_tokens', { token }, {
      $set: {
        used: true,
        used_at: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (err) {
    console.error('Password reset confirm error:', err.message);
    return res.status(500).json({ detail: 'Failed to reset password' });
  }
};
