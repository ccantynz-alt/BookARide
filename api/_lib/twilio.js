/**
 * Twilio SMS sender — the ONLY SMS provider.
 *
 * Uses the Twilio REST API directly via native fetch (no npm twilio package
 * needed). This mirrors api/_lib/mailgun.js so the codebase has exactly one
 * pattern for third-party HTTP integrations.
 *
 * Required Vercel env vars:
 *   TWILIO_ACCOUNT_SID   — starts with AC...
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_PHONE_NUMBER  — the E.164 sender, e.g. +64xxxxxxxxx
 *
 * If any of these are missing, sendSms() logs a CRITICAL warning and
 * returns false. It NEVER throws — an SMS failure must not break a
 * booking or crash a webhook.
 *
 * CLAUDE.md locked decision: SMS is Twilio only. No other providers,
 * no fallbacks. See section "SMS — Twilio only (2026-04-10)".
 */

/**
 * Normalise a NZ or international phone number to E.164.
 *
 * Accepts:
 *   "021 743 321"      -> "+64217433210" (invalid — too short, returns null)
 *   "0217433211"       -> "+64217433211"
 *   "021-7433211"      -> "+64217433211"
 *   "+64 21 743 3211"  -> "+64217433211"
 *   "+61 412 345 678"  -> "+61412345678" (Australian — passed through)
 *   "1 555 123 4567"   -> "+15551234567" (US — passed through)
 *   "021 7433211"      -> "+64217433211"
 *
 * NZ mobile numbers start with 02 (021, 022, 027, 029, 020, 028). When a
 * number begins with 0 and has 9–11 digits total, we assume NZ and
 * replace the leading 0 with +64.
 *
 * Returns null if the number cannot be normalised (too short, empty, etc).
 */
function normaliseNzPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // Keep + and digits only
  let cleaned = raw.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return null;

  // Already E.164 — light validation: must be + followed by 8–15 digits
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (digits.length < 8 || digits.length > 15) return null;
    if (!/^\d+$/.test(digits)) return null;
    return cleaned;
  }

  // No + but starts with 64 (NZ country code) — add +
  if (cleaned.startsWith('64') && cleaned.length >= 10 && cleaned.length <= 13) {
    return `+${cleaned}`;
  }

  // NZ local format — starts with 0, has 9–11 digits total (021 ... through 09 ...)
  if (cleaned.startsWith('0') && cleaned.length >= 9 && cleaned.length <= 11) {
    return `+64${cleaned.slice(1)}`;
  }

  // Last-ditch: if 8–15 digits with no prefix, assume NZ mobile and prepend +64
  if (/^\d{8,11}$/.test(cleaned)) {
    return `+64${cleaned}`;
  }

  return null;
}

/**
 * Send an SMS via Twilio.
 *
 * @param {object} opts
 * @param {string} opts.to     Destination phone (any format — will be normalised)
 * @param {string} opts.body   Message body (keep under 320 chars to stay within 2 segments)
 * @returns {Promise<boolean>} true on success, false on any failure (never throws)
 */
async function sendSms({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error(
      `CRITICAL: Cannot send SMS to ${to}: Twilio env vars not configured ` +
      `(TWILIO_ACCOUNT_SID=${accountSid ? 'set' : 'MISSING'}, ` +
      `TWILIO_AUTH_TOKEN=${authToken ? 'set' : 'MISSING'}, ` +
      `TWILIO_PHONE_NUMBER=${fromNumber ? 'set' : 'MISSING'})`
    );
    return false;
  }

  if (!accountSid.startsWith('AC')) {
    console.error(`CRITICAL: TWILIO_ACCOUNT_SID does not start with 'AC' — likely not a valid Twilio SID`);
    return false;
  }

  const normalised = normaliseNzPhone(to);
  if (!normalised) {
    console.error(`Cannot send SMS: could not normalise phone number '${to}' to E.164`);
    return false;
  }

  if (!body || !body.trim()) {
    console.error(`Cannot send SMS to ${normalised}: empty body`);
    return false;
  }

  const formData = new URLSearchParams();
  formData.append('To', normalised);
  formData.append('From', fromNumber);
  formData.append('Body', body);

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`SMS sent via Twilio to ${normalised} — sid=${data.sid || 'ok'}, status=${data.status || 'queued'}`);
      return true;
    } else {
      const text = await res.text();
      console.error(`CRITICAL: Twilio ${res.status} error sending to ${normalised}: ${text}`);

      // Common failure diagnostics
      if (res.status === 401) {
        console.error('  -> Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct');
      } else if (res.status === 400) {
        console.error('  -> Bad request — check TWILIO_PHONE_NUMBER is E.164 and verified for the destination country');
      } else if (res.status === 403) {
        console.error('  -> Forbidden — destination may not be an allowed region on your Twilio account (check Geo Permissions)');
      }

      return false;
    }
  } catch (err) {
    console.error(`CRITICAL: Twilio send failed to ${normalised}: ${err.message}`);
    return false;
  }
}

module.exports = { sendSms, normaliseNzPhone };
