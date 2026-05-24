/**
 * GET /api/admin/google-auth/callback
 * Handle Google OAuth callback — exchange code for tokens, verify admin, redirect with JWT.
 */
const { findOne } = require('../../_lib/db');
const jwt = require('jsonwebtoken');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const [key, ...val] = c.trim().split('=');
    cookies[key] = val.join('=');
  });
  return cookies;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const publicDomain = (process.env.PUBLIC_DOMAIN || 'https://www.bookaride.co.nz').replace(/\/$/, '');
  const callbackUrl = `${publicDomain}/admin/auth/callback`;

  function redirectError(error, message) {
    const params = new URLSearchParams({ error, message });
    res.writeHead(302, { Location: `${callbackUrl}?${params.toString()}` });
    res.end();
  }

  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return redirectError('missing_params', 'Sign-in was cancelled or incomplete. Please try again.');
    }

    // Verify state cookie (CSRF protection)
    const cookies = parseCookies(req.headers.cookie);
    const savedState = cookies.admin_oauth_state;
    if (!savedState || savedState !== state || !state.startsWith('bookaride_admin_oauth_')) {
      return redirectError('invalid_state', 'Invalid or expired sign-in. Please try again.');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return redirectError('config', 'Server OAuth not configured.');
    }

    // Build the same callback URL that was used in the auth request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/admin/google-auth/callback`;

    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResp.ok) {
      console.error('Google token error:', await tokenResp.text());
      return redirectError('token_exchange', 'Sign-in failed. Please try again.');
    }

    const tokens = await tokenResp.json();

    // Get user info
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResp.ok) {
      return redirectError('user_info', 'Could not get account info. Please try again.');
    }

    const userInfo = await userResp.json();
    const email = (userInfo.email || '').toLowerCase().trim();
    if (!email) {
      return redirectError('no_email', 'Email not provided by Google.');
    }

    // Check if this email belongs to an admin
    const admin = await findOne('admin_users', { email });
    if (!admin) {
      console.warn(`Google OAuth attempt for non-admin: ${email}`);
      return redirectError('unauthorized', 'This Google account is not authorized.');
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      return redirectError('config', 'JWT not configured on server.');
    }

    const accessToken = jwt.sign(
      { sub: admin.username, admin_id: admin.id },
      secret,
      { expiresIn: '24h' }
    );

    // Clear the state cookie and redirect to frontend with token
    res.setHeader('Set-Cookie', 'admin_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure');
    res.writeHead(302, { Location: `${callbackUrl}#token=${accessToken}` });
    res.end();
  } catch (err) {
    console.error('Google auth callback error:', err.message);
    redirectError('server_error', 'Sign-in failed. Please try again.');
  }
};
