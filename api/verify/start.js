/**
 * POST /api/verify/start — send an OTP code to a phone number.
 *
 * Vapron Verify (Craig authorised 2026-06-10). Admin-auth only for
 * now: nothing customer-facing consumes this yet, and an open OTP
 * endpoint would let anyone burn SMS credit. When Craig decides where
 * verification appears in the booking flow, the auth model gets
 * revisited with him.
 *
 * Requires VAPRON_VERIFY_SERVICE_ID (from the Vapron dashboard) in
 * Vercel env vars.
 */
const { verifyAdmin } = require('../_lib/auth');
const { vapronCall } = require('../_lib/vapron');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });
  if (!verifyAdmin(req, res)) return;

  try {
    const { phone } = req.body || {};
    const cleaned = (phone || '').replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(cleaned)) {
      return res.status(400).json({ detail: 'A valid phone number is required (e.g. +6421743321)' });
    }

    const serviceId = process.env.VAPRON_VERIFY_SERVICE_ID;
    if (!serviceId) {
      console.error('CRITICAL: VAPRON_VERIFY_SERVICE_ID not set — cannot start OTP verification');
      return res.status(500).json({ detail: 'Verification service is not configured' });
    }

    // Default to NZ country code when none given
    const to = cleaned.startsWith('+') ? cleaned : `+64${cleaned.replace(/^0/, '')}`;

    const result = await vapronCall('customerVerify.verifications.start', {
      serviceId,
      to,
      channel: 'sms',
    });

    if (!result.ok) {
      return res.status(502).json({ detail: 'Could not send the verification code. Please try again.' });
    }

    return res.status(200).json({
      verificationId: result.data?.verificationId || result.data?.id || null,
      to,
    });
  } catch (err) {
    console.error('CRITICAL: OTP start failed:', err.message);
    return res.status(500).json({ detail: 'Could not send the verification code. Please try again.' });
  }
};
