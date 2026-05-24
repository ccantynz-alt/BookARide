/**
 * GET /api/admin/password-reset/validate/:token
 * Validate if a password reset token is still valid.
 */
const { findOne } = require('../../../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, detail: 'Token is required' });
    }

    const tokenDoc = await findOne('password_reset_tokens', { token });
    if (!tokenDoc || tokenDoc.used === true) {
      return res.status(200).json({ valid: false });
    }

    // Check expiry
    const expiresAt = new Date(tokenDoc.expires_at);
    if (expiresAt < new Date()) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      email: tokenDoc.email,
    });
  } catch (err) {
    console.error('Token validate error:', err.message);
    return res.status(500).json({ valid: false, detail: 'Validation failed' });
  }
};
