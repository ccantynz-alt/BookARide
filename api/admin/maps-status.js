/**
 * GET /api/admin/maps-status
 * Check Google Maps API key status and test autocomplete.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(200).json({
      status: 'not_configured',
      key_present: false,
      message: 'GOOGLE_MAPS_API_KEY not set in environment variables',
    });
  }

  try {
    // Test with a known NZ address
    const params = new URLSearchParams({
      input: 'Auckland Airport',
      key: apiKey,
      components: 'country:nz',
      types: 'geocode|establishment',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );
    const data = await response.json();

    return res.status(200).json({
      status: data.status === 'OK' ? 'working' : 'error',
      key_present: true,
      key_prefix: apiKey.substring(0, 8) + '***',
      google_status: data.status,
      predictions_count: data.predictions?.length || 0,
      error_message: data.error_message || null,
    });
  } catch (err) {
    return res.status(200).json({
      status: 'error',
      key_present: true,
      key_prefix: apiKey.substring(0, 8) + '***',
      error: err.message,
    });
  }
};
