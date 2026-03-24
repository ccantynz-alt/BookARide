/**
 * Mailgun email sender — the ONLY email provider.
 * No SMTP, no SendGrid, no fallbacks to other providers.
 */

async function sendEmail({ to, subject, html, from, fromName = 'BookaRide', replyTo, cc }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'mg.bookaride.co.nz';

  if (!apiKey) {
    console.error(`Cannot send email to ${to}: MAILGUN_API_KEY not set`);
    return false;
  }

  if (!to || !to.includes('@')) {
    console.error(`Cannot send email: invalid recipient '${to}'`);
    return false;
  }

  const sender = from || process.env.NOREPLY_EMAIL || 'noreply@bookaride.co.nz';

  const formData = new URLSearchParams();
  formData.append('from', fromName ? `${fromName} <${sender}>` : sender);
  formData.append('to', to.trim());
  formData.append('subject', subject);
  formData.append('html', html);
  if (replyTo) formData.append('h:Reply-To', replyTo);
  if (cc) formData.append('cc', cc);

  try {
    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    if (res.ok) {
      console.log(`Email sent via Mailgun to ${to}`);
      return true;
    } else {
      const text = await res.text();
      console.error(`Mailgun error ${res.status}: ${text}`);
      return false;
    }
  } catch (err) {
    console.error(`Mailgun send failed: ${err.message}`);
    return false;
  }
}

module.exports = { sendEmail };
