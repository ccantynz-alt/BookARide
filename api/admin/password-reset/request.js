/**
 * POST /api/admin/password-reset/request
 * Send a password reset email to admin.
 */
const { findOne, insertOne } = require('../../_lib/db');
const crypto = require('crypto');
const { sendEmail } = require('../../_lib/mailgun');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success for security (don't reveal if email exists)
    const successMsg = { message: 'If this email is registered, you will receive a password reset link.' };

    const admin = await findOne('admin_users', { email: normalizedEmail });
    if (!admin) {
      return res.status(200).json(successMsg);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await insertOne('password_reset_tokens', {
      id: crypto.randomUUID(),
      admin_id: admin.id,
      username: admin.username,
      email: normalizedEmail,
      token: resetToken,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    });

    // Build reset link
    const publicDomain = (process.env.PUBLIC_DOMAIN || 'https://www.bookaride.co.nz').replace(/\/$/, '');
    const resetLink = `${publicDomain}/admin/reset-password?token=${resetToken}`;

    // Send email via Mailgun
    const htmlContent = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#D4AF37;padding:20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Book A Ride NZ</h1>
        </div>
        <div style="padding:30px 20px;">
          <p>Hello <strong>${admin.username}</strong>,</p>
          <p>We received a request to reset your admin password for Book A Ride NZ.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${resetLink}" style="background:#D4AF37;color:#000;padding:14px 32px;text-decoration:none;font-weight:bold;border-radius:6px;display:inline-block;">Reset Password</a>
          </div>
          <div style="background:#fffbeb;padding:12px 16px;border-left:4px solid #eab308;margin:20px 0;">
            <strong>This link will expire in 1 hour.</strong><br>
            If you did not request this reset, please ignore this email.
          </div>
          <p style="font-size:12px;color:#999;word-break:break-all;">Or copy and paste this link:<br>${resetLink}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: normalizedEmail,
      subject: 'Password Reset Request - Book A Ride NZ Admin',
      html: htmlContent,
      fromName: 'BookaRide NZ',
      replyTo: 'info@bookaride.co.nz',
    });

    return res.status(200).json(successMsg);
  } catch (err) {
    console.error('Password reset request error:', err.message);
    return res.status(500).json({ detail: 'Failed to process password reset request' });
  }
};
