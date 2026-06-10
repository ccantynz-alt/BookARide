/**
 * POST /api/verify/check — check an OTP code sent via /api/verify/start.
 *
 * Vapron Verify (Craig authorised 2026-06-10). Admin-auth only — see
 * the note in start.js.
 */
const { verifyAdmin } = require('../_lib/auth');
const { vapronCall } = require('../_lib/vapron');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });
  if (!verifyAdmin(req, res)) return;

  try {
    const { verificationId, code } = req.body || {};
    if (!verificationId || !/^[0-9]{4,8}$/.test(code || '')) {
      return res.status(400).json({ detail: 'verificationId and the numeric code are required' });
    }

    const result = await vapronCall('customerVerify.verifications.check', {
      verificationId,
      code,
    });

    if (!result.ok) {
      return res.status(502).json({ detail: 'Could not check the verification code. Please try again.' });
    }

    const verified =
      result.data?.verified === true ||
      result.data?.status === 'approved' ||
      result.data?.valid === true;

    return res.status(200).json({ verified });
  } catch (err) {
    console.error('CRITICAL: OTP check failed:', err.message);
    return res.status(500).json({ detail: 'Could not check the verification code. Please try again.' });
  }
};
