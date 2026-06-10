/**
 * Twilio SMS sender — the ONLY SMS provider.
 *
 * Locked 2026-04-28 by Craig. Mirrors the email helper pattern (raw fetch
 * to the Twilio REST API, no SDK dependency) so we don't add an npm
 * package just to POST a form-encoded body.
 *
 * Required env vars (set in Vercel dashboard):
 *   TWILIO_ACCOUNT_SID   — starts with AC...
 *   TWILIO_AUTH_TOKEN    — Twilio account auth token
 *   TWILIO_PHONE_NUMBER  — E.164 sender, e.g. +6427... for the NZ number
 *
 * If any are missing, sendSMS() logs CRITICAL and returns false. Callers
 * MUST treat SMS as best-effort — the booking flow continues regardless.
 */

const TWILIO_ENDPOINT = 'https://api.twilio.com/2010-04-01';

/**
 * Normalise a phone number to E.164 (the format Twilio requires).
 * Accepts any of: "021 123 4567", "0211234567", "+64211234567",
 * "64211234567", "(021) 123-4567". Defaults to NZ (+64) when no
 * country code is present. Returns null if the number can't be parsed.
 */
function normalisePhone(raw) {
  if (!raw) return null;
  let p = String(raw).trim();
  const hasPlus = p.startsWith('+');
  p = p.replace(/\D/g, '');
  if (!p) return null;

  if (hasPlus) {
    return /^\d{8,15}$/.test(p) ? `+${p}` : null;
  }

  // Strip leading zeros (NZ mobiles are written as 021... domestically)
  p = p.replace(/^0+/, '');

  // Already has country code
  if (p.startsWith('64') && p.length >= 10 && p.length <= 12) return `+${p}`;

  // Bare digits — assume NZ mobile
  if (/^\d{8,10}$/.test(p)) return `+64${p}`;

  return null;
}

async function sendSMS({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.error(`CRITICAL: Cannot send SMS to ${to}: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER not set in Vercel env vars`);
    return false;
  }

  const dest = normalisePhone(to);
  if (!dest) {
    console.error(`Cannot send SMS: invalid phone number '${to}'`);
    return false;
  }

  if (!body || !String(body).trim()) {
    console.error(`Cannot send SMS to ${dest}: empty body`);
    return false;
  }

  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', dest);
  params.append('Body', String(body));

  try {
    const url = `${TWILIO_ENDPOINT}/Accounts/${sid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`SMS sent via Twilio to ${dest} — ${data.sid || 'ok'}`);
      return true;
    }

    const text = await res.text();
    console.error(`CRITICAL: Twilio ${res.status} error sending to ${dest}: ${text}`);
    if (res.status === 401) {
      console.error('  -> Check TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are correct and not revoked');
    } else if (res.status === 400) {
      console.error(`  -> 400 usually means TWILIO_PHONE_NUMBER ('${from}') is not authorised to send to ${dest}, or the destination is not a real mobile, or the body is malformed`);
    } else if (res.status === 403) {
      console.error('  -> 403 usually means the Twilio account is suspended or geographic permissions block sending to NZ. Check Twilio console > Geo Permissions.');
    }
    return false;
  } catch (err) {
    console.error(`CRITICAL: Twilio send threw to ${dest}: ${err.message}`);
    return false;
  }
}

/**
 * Resolve the customer's confirmation channel preference. Defaults to
 * 'both' when the field is missing or unrecognised — a missing preference
 * is almost always a data issue, not an opt-out, and over-notifying is
 * safer than missing a confirmation.
 */
function wantsSMS(booking) {
  const p = String(booking?.notificationPreference || 'both').toLowerCase();
  return p === 'sms' || p === 'both';
}

function wantsEmail(booking) {
  const p = String(booking?.notificationPreference || 'both').toLowerCase();
  return p === 'email' || p === 'both';
}

function isTwilioConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

module.exports = { sendSMS, normalisePhone, wantsSMS, wantsEmail, isTwilioConfigured };
