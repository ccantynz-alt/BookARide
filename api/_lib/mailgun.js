/**
 * Mailgun email sender — the ONLY email provider.
 * No SMTP, no SendGrid, no fallbacks to other providers.
 *
 * Supports both US and EU Mailgun regions via MAILGUN_REGION env var.
 * Defaults to EU (bookaride.co.nz is NZ — Mailgun routes NZ/AU/UK domains to EU).
 */

const MAILGUN_ENDPOINTS = {
  us: 'https://api.mailgun.net',
  eu: 'https://api.eu.mailgun.net',
};

async function sendEmail({ to, subject, html, from, fromName = 'BookaRide', replyTo, cc }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'mg.bookaride.co.nz';
  const region = (process.env.MAILGUN_REGION || 'eu').toLowerCase();

  if (!apiKey) {
    console.error(`CRITICAL: Cannot send email to ${to}: MAILGUN_API_KEY not set in environment`);
    return false;
  }

  if (!to || !to.includes('@')) {
    console.error(`Cannot send email: invalid recipient '${to}'`);
    return false;
  }

  const sender = from || process.env.NOREPLY_EMAIL || `noreply@${domain}`;
  const endpoint = MAILGUN_ENDPOINTS[region] || MAILGUN_ENDPOINTS.eu;

  const formData = new URLSearchParams();
  formData.append('from', fromName ? `${fromName} <${sender}>` : sender);
  formData.append('to', to.trim());
  formData.append('subject', subject);
  formData.append('html', html);
  if (replyTo) formData.append('h:Reply-To', replyTo);
  if (cc) formData.append('cc', cc);

  try {
    const url = `${endpoint}/v3/${domain}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`Email sent via Mailgun (${region.toUpperCase()}) to ${to} — ${data.id || 'ok'}`);
      return true;
    } else {
      const text = await res.text();
      console.error(`CRITICAL: Mailgun ${res.status} error sending to ${to} via ${url}: ${text}`);

      // Common failure diagnostics
      if (res.status === 401) {
        console.error('  → Check MAILGUN_API_KEY is correct and not expired');
      } else if (res.status === 404) {
        console.error(`  → Domain '${domain}' not found — check MAILGUN_DOMAIN and verify domain in Mailgun dashboard`);
      } else if (res.status === 403) {
        console.error(`  → Forbidden — domain may not be verified, or sender '${sender}' not authorized. Check Mailgun dashboard.`);
        console.error(`  → If using sandbox domain, recipient must be whitelisted in Mailgun`);
      }

      return false;
    }
  } catch (err) {
    console.error(`CRITICAL: Mailgun send failed to ${to}: ${err.message}`);
    return false;
  }
}

module.exports = { sendEmail };
