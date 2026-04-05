/**
 * GET /api/maps/client-key
 * Return Google Maps API key for frontend autocomplete.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not set — address autocomplete will fail');
  }
  return res.status(200).json({ key: apiKey });
};
