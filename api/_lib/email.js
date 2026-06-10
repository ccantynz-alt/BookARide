/**
 * Email sender — Vapron is the ONLY email provider (Craig authorised
 * the switch from Mailgun on 2026-06-10). No SMTP, no SendGrid, no
 * fallbacks to other providers.
 *
 * The email ADDRESS architecture from CLAUDE.md 6e is unchanged and
 * still locked:
 *   - bookings@bookaride.co.nz  — admin notification inbox
 *   - noreply@bookaride.co.nz   — From address on customer emails
 *   - info@bookaride.co.nz      — customer support, replyTo on all
 *     customer emails
 */

const { vapronCall } = require('./vapron');

async function sendEmail({ to, subject, html, from, fromName = 'BookaRide', replyTo, cc }) {
  if (!to || !to.includes('@')) {
    console.error(`Cannot send email: invalid recipient '${to}'`);
    return false;
  }

  const sender = from || process.env.NOREPLY_EMAIL || 'noreply@bookaride.co.nz';

  const params = {
    to: to.trim(),
    subject,
    html,
    from: fromName ? `${fromName} <${sender}>` : sender,
  };
  if (replyTo) params.replyTo = replyTo;
  if (cc) params.cc = cc;

  const result = await vapronCall('customerEmail.send', params);

  if (result.ok) {
    console.error(`Email sent via Vapron to ${to} — ${result.data?.id || 'ok'}`);
    return true;
  }

  console.error(`CRITICAL: Vapron email send failed to ${to}: ${result.error}`);
  if (result.status === 401 || result.status === 403) {
    console.error('  → Check VAPRON_API_KEY is set in Vercel and has not been revoked (it was rotated on 2026-06-10)');
  } else if (result.status === 0) {
    console.error('  → VAPRON_API_KEY missing or api.vapron.ai unreachable from this function');
  }
  return false;
}

module.exports = { sendEmail };
