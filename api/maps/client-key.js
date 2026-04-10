/**
 * GET /api/maps/client-key
 *
 * Returns the Google Maps API key. Kept as a legacy stub per CLAUDE.md
 * section 6c: the frontend no longer loads Google Maps JS in the browser
 * (banned — it locked the input and broke bookings), and the server-side
 * autocomplete endpoint (api/places/autocomplete.js) reads the key
 * directly from process.env. This handler has no current callers in the
 * frontend, but it stays in place so any distance/directions helper that
 * gets ported from the old Python backend has a stable place to fetch
 * the key from without hitting Google directly.
 *
 * DO NOT use this to reintroduce Google's native Places Autocomplete
 * widget. That is BANNED — see CLAUDE.md section 6c "Google Address
 * Autocomplete".
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
