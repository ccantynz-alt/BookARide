/**
 * GET /api/admin/test-email?to=someone@example.com
 *
 * Definitive Mailgun diagnostic. Sends a real test email and returns the
 * EXACT Mailgun HTTP response (status code, body, timing) plus all the
 * resolved config values so you can see in ONE look why admin booking
 * confirmations are not arriving.
 *
 * This is what you hit when the booking system "should work" but emails
 * are not showing up. It bypasses the booking flow entirely and just
 * tests the Mailgun path end-to-end.
 *
 * Auth: admin JWT (same as /api/admin/me).
 *
 * Example:
 *   GET /api/admin/test-email
 *      → sends to BOOKINGS_NOTIFICATION_EMAIL (or default)
 *   GET /api/admin/test-email?to=craig@example.com
 *      → sends to that address
 *
 * Response always returns the raw Mailgun outcome — even on auth failure
 * we return a JSON body explaining why.
 */
const jwt = require('jsonwebtoken');
const { findOne } = require('../_lib/db');

const MAILGUN_ENDPOINTS = {
  us: 'https://api.mailgun.net',
  eu: 'https://api.eu.mailgun.net',
};

function redact(value) {
  if (!value) return null;
  if (value.length <= 8) return '***';
  return `${value.substring(0, 8)}***`;
}

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, detail: 'Admin authentication required (no Bearer token)' };
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) return { ok: false, status: 500, detail: 'JWT_SECRET_KEY not configured on server' };
  try {
    const payload = jwt.verify(token, secret);
    const admin = await findOne('admin_users', { username: payload.sub });
    if (!admin) return { ok: false, status: 401, detail: 'Admin user not found' };
    return { ok: true, admin };
  } catch {
    return { ok: false, status: 401, detail: 'Invalid or expired admin token' };
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const auth = await verifyAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ detail: auth.detail });

  // === Collect config ===
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'mg.bookaride.co.nz';
  const region = (process.env.MAILGUN_REGION || 'eu').toLowerCase();
  const adminRecipient = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
  const sender = process.env.NOREPLY_EMAIL || `noreply@${domain}`;
  const endpoint = MAILGUN_ENDPOINTS[region] || MAILGUN_ENDPOINTS.eu;

  const recipient = (req.query.to || adminRecipient).trim();

  const config = {
    MAILGUN_API_KEY_set: !!apiKey,
    MAILGUN_API_KEY_prefix: redact(apiKey),
    MAILGUN_DOMAIN: domain,
    MAILGUN_DOMAIN_was_default: !process.env.MAILGUN_DOMAIN,
    MAILGUN_REGION: region,
    NOREPLY_EMAIL_set: !!process.env.NOREPLY_EMAIL,
    sender_computed: sender,
    BOOKINGS_NOTIFICATION_EMAIL_set: !!process.env.BOOKINGS_NOTIFICATION_EMAIL,
    BOOKINGS_NOTIFICATION_EMAIL_was_default: !process.env.BOOKINGS_NOTIFICATION_EMAIL,
    admin_recipient_resolved: adminRecipient,
    test_recipient: recipient,
    mailgun_url: `${endpoint}/v3/${domain}/messages`,
  };

  // === Short-circuit: key not set ===
  if (!apiKey) {
    return res.status(500).json({
      status: 'broken',
      reason: 'MAILGUN_API_KEY not set in Vercel environment',
      fix: 'Vercel dashboard → Settings → Environment Variables → add MAILGUN_API_KEY → redeploy',
      config,
    });
  }

  // === Build the test email ===
  const now = new Date().toISOString();
  const subject = `BookARide Mailgun Test — ${now}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#059669;">Mailgun Test Email</h2>
      <p>If you are reading this, your Mailgun pipeline is working correctly.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Sent at</strong></td><td style="padding:8px;">${now}</td></tr>
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Triggered by</strong></td><td style="padding:8px;">Admin "${auth.admin.username}" via /api/admin/test-email</td></tr>
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Mailgun domain</strong></td><td style="padding:8px;">${domain}</td></tr>
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Mailgun region</strong></td><td style="padding:8px;">${region.toUpperCase()}</td></tr>
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Sender</strong></td><td style="padding:8px;">${sender}</td></tr>
        <tr><td style="padding:8px;background:#f8f8f8;"><strong>Recipient</strong></td><td style="padding:8px;">${recipient}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;">This is a diagnostic email from BookARide. Safe to delete.</p>
    </div>
  `;

  // === Fire the test ===
  const formData = new URLSearchParams();
  formData.append('from', `BookaRide Diagnostic <${sender}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('html', html);

  const t0 = Date.now();
  let mailgunResponse = null;
  let mailgunBody = null;
  let sendError = null;

  try {
    const resp = await fetch(`${endpoint}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: formData,
    });
    mailgunResponse = {
      status_code: resp.status,
      status_text: resp.statusText,
      ok: resp.ok,
    };
    mailgunBody = await resp.text();
  } catch (err) {
    sendError = { message: err.message, name: err.name };
  }
  const elapsedMs = Date.now() - t0;

  // === Diagnose ===
  const diagnosis = diagnose({ mailgunResponse, mailgunBody, sendError, config });

  const response = {
    status: mailgunResponse?.ok ? 'sent' : 'failed',
    elapsed_ms: elapsedMs,
    subject,
    sender,
    recipient,
    mailgun_response: mailgunResponse,
    mailgun_body: mailgunBody,
    send_error: sendError,
    config,
    diagnosis,
  };

  return res.status(mailgunResponse?.ok ? 200 : 500).json(response);
};

function diagnose({ mailgunResponse, mailgunBody, sendError, config }) {
  if (sendError) {
    return {
      likely_cause: 'Network error reaching Mailgun',
      message: sendError.message,
      next_steps: 'Check MAILGUN_REGION is correct (eu vs us) and Vercel can reach mailgun.net',
    };
  }

  if (!mailgunResponse) {
    return { likely_cause: 'Unknown — no response captured' };
  }

  if (mailgunResponse.ok) {
    const warnings = [];
    if (config.BOOKINGS_NOTIFICATION_EMAIL_was_default) {
      warnings.push(`BOOKINGS_NOTIFICATION_EMAIL is NOT set in Vercel — admin notifications go to the fallback (${config.admin_recipient_resolved}). If that is not the inbox you actually monitor, THAT is why you never see the emails. Set BOOKINGS_NOTIFICATION_EMAIL to your real inbox and redeploy.`);
    }
    if (config.MAILGUN_DOMAIN_was_default) {
      warnings.push(`MAILGUN_DOMAIN is NOT set in Vercel — defaulting to mg.bookaride.co.nz. Confirm this matches the domain you verified in Mailgun.`);
    }
    if (!config.NOREPLY_EMAIL_set) {
      warnings.push(`NOREPLY_EMAIL is NOT set — sender defaults to ${config.sender_computed}. If Mailgun has not authorised this sender, mail will land in spam or be rejected by receivers.`);
    }
    return {
      likely_cause: warnings.length > 0 ? 'Email DISPATCHED by Mailgun but delivery may still be compromised' : 'OK',
      warnings,
      next_steps: [
        `Open the inbox for ${config.test_recipient} — check spam / promotions as well`,
        'If the email is NOT in the inbox OR spam, it was accepted by Mailgun but rejected by the receiving server (DKIM / SPF / reputation). Check Mailgun dashboard → Logs',
        'If the email IS in spam, set up DKIM + SPF for the Mailgun domain in your DNS provider (one-time)',
      ],
    };
  }

  // mailgun returned a non-OK status
  const body = (mailgunBody || '').toLowerCase();

  if (mailgunResponse.status_code === 401) {
    return {
      likely_cause: 'MAILGUN_API_KEY is invalid, expired, or wrong region',
      next_steps: [
        `Open Mailgun dashboard → API Keys → check the Private API key matches what is in Vercel (MAILGUN_API_KEY)`,
        `If the key starts with "key-" it is an older key — the current format is just a long string. Regenerate if needed.`,
        `Check MAILGUN_REGION matches your Mailgun account (EU or US). Currently set to: ${config.MAILGUN_REGION}. EU region keys do NOT work on the US endpoint and vice versa.`,
      ],
    };
  }
  if (mailgunResponse.status_code === 404) {
    return {
      likely_cause: `Mailgun domain "${config.MAILGUN_DOMAIN}" does not exist on this Mailgun account`,
      next_steps: [
        'Open Mailgun dashboard → Sending → Domains',
        `Confirm the domain "${config.MAILGUN_DOMAIN}" is listed and verified`,
        `Match MAILGUN_DOMAIN in Vercel to whatever is actually verified in Mailgun`,
      ],
    };
  }
  if (mailgunResponse.status_code === 403) {
    if (body.includes('sandbox')) {
      return {
        likely_cause: 'Mailgun is using a SANDBOX domain and the recipient is not whitelisted',
        next_steps: [
          'Sandbox domains only send to whitelisted "Authorized Recipients" — every inbox must be added manually',
          `Either: add ${config.test_recipient} as an Authorized Recipient in Mailgun → Sending → Domain settings → Authorized Recipients`,
          'Or (strongly recommended): buy and verify your own domain (mg.bookaride.co.nz) and set MAILGUN_DOMAIN to that. No more whitelisting.',
        ],
      };
    }
    return {
      likely_cause: `Mailgun returned 403 — domain not verified or sender "${config.sender_computed}" not authorised`,
      next_steps: [
        'Mailgun dashboard → Sending → Domains → click the domain → Verify DNS records (SPF, DKIM, MX)',
        'Every missing DNS record must be added to your domain registrar (Cloudflare, GoDaddy, etc.)',
        'Verification can take up to 48 hours but is usually under 30 minutes',
      ],
    };
  }
  if (mailgunResponse.status_code === 400) {
    return {
      likely_cause: 'Mailgun rejected the request as malformed',
      next_steps: [
        'Check the mailgun_body field above for the specific error',
        'Common causes: recipient address looks invalid, sender not on the domain, HTML content is malformed',
      ],
    };
  }
  return {
    likely_cause: `Mailgun returned status ${mailgunResponse.status_code} — see mailgun_body for the full error message`,
    next_steps: 'Paste the mailgun_body into Mailgun support if the message is unclear.',
  };
}
