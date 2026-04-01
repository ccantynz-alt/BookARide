/**
 * GET /api/admin/google-auth/start
 * Start Google OAuth flow — redirects to Google sign-in.
 */
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        detail: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }

    // Build callback URL — same Vercel domain
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/admin/google-auth/callback`;

    const state = `bookaride_admin_oauth_${crypto.randomBytes(16).toString('hex')}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Store state in a cookie for CSRF protection
    res.setHeader('Set-Cookie', `admin_oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`);

    // Redirect to Google
    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (err) {
    console.error('Google auth start error:', err.message);
    return res.status(500).json({ detail: 'Failed to start Google sign-in' });
  }
};
