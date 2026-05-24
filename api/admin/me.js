/**
 * GET /api/admin/me
 * Verify admin JWT token and return admin info.
 */
const jwt = require('jsonwebtoken');
const { findOne } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ detail: 'Authentication not configured' });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ detail: 'Invalid or expired token' });
    }

    const admin = await findOne('admin_users', { username: payload.sub });
    if (!admin) {
      return res.status(401).json({ detail: 'Admin user not found' });
    }

    return res.status(200).json({
      username: admin.username,
      email: admin.email || '',
      id: admin.id,
      role: admin.role || 'admin',
    });
  } catch (err) {
    console.error('Admin me error:', err.message);
    return res.status(500).json({ detail: 'Authentication check failed' });
  }
};
