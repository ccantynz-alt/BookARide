/**
 * GET /api/maps/client-key
 *
 * Returns the Google Maps JS API key so the frontend can load Google's
 * native Places Autocomplete widget in GoogleAddressInput.jsx.
 *
 * This endpoint is CRITICAL — without it, GoogleAddressInput falls back
 * to the old custom dropdown which is broken. See CLAUDE.md "Google
 * Address Autocomplete" locked decision.
 *
 * Security note: This exposes the Maps JS API key to the browser. That's
 * unavoidable because Google Maps JS runs client-side. Restrict the key
 * in the Google Cloud Console to your production domains (HTTP referrer
 * restriction) so it can't be abused by third parties.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  // Cache at the edge for 1 hour — the key doesn't change often
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const key = process.env.GOOGLE_MAPS_API_KEY || '';

  if (!key) {
    console.error('CRITICAL: GOOGLE_MAPS_API_KEY env var is not set on Vercel');
    return res.status(500).json({
      key: '',
      error: 'Google Maps API key is not configured on the server. Set GOOGLE_MAPS_API_KEY in Vercel environment variables.',
    });
  }

  return res.status(200).json({ key });
};
