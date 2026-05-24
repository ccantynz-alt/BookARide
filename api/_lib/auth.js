/**
 * Shared JWT authentication helper for admin API endpoints.
 * Use verifyAdmin(req, res) to guard any endpoint that requires admin login.
 * Returns the decoded payload on success, or sends 401 and returns null.
 */
const jwt = require('jsonwebtoken');

function verifyAdmin(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Not authenticated' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    res.status(500).json({ detail: 'Authentication not configured' });
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch {
    res.status(401).json({ detail: 'Invalid or expired session — please log in again' });
    return null;
  }
}

module.exports = { verifyAdmin };
