/**
 * GET /api/maps/client-key
 *
 * Returns the Google Maps API key. CURRENTLY UNUSED by the frontend —
 * GoogleAddressInput.jsx uses /api/places/autocomplete (server-side) for
 * suggestions, and /api/calculate-price (server-side) for distance.
 *
 * CLAUDE.md section 6c LOCKS IN that Google Maps JS must NEVER be loaded
 * in the browser. Re-introducing the native Places Autocomplete widget
 * locks the input field when the key is invalid/restricted/expired and
 * has cost the business real customers multiple times since Nov 2025.
 *
 * This endpoint is kept only as a safe placeholder so /api/maps/client-key
 * does not 404 if some legacy client somewhere still hits it. Do NOT add
 * a frontend caller for this endpoint without first updating CLAUDE.md 6c.
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
