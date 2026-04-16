/**
 * POST /api/calculate-price
 * Calculate booking price based on pickup/dropoff addresses.
 * Replaces: Python backend POST /api/calculate-price
 */
const { calculatePrice } = require('./_lib/pricing');
const { getDistance } = require('./_lib/google-maps');

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const {
      pickupAddress,
      dropoffAddress,
      pickupAddresses = [],
      passengers = 1,
      bookReturn = false,
      vipAirportPickup = false,
      oversizedLuggage = false,
    } = req.body;

    if (!pickupAddress || !dropoffAddress) {
      return res.status(400).json({ detail: 'pickupAddress and dropoffAddress are required' });
    }

    // Get distance from Google Maps — REQUIRED. No fallback.
    const waypointAddrs = (pickupAddresses || []).filter(a => a && a.trim());
    const distanceKm = await getDistance(pickupAddress, dropoffAddress, waypointAddrs);

    if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm <= 0) {
      console.error(
        `CRITICAL: Google Maps returned no distance for "${pickupAddress}" -> "${dropoffAddress}". ` +
        `Refusing to quote — owner banned silent fallbacks 2026-04-16. ` +
        `Check GOOGLE_MAPS_API_KEY in Vercel env vars, API key restrictions, and Distance Matrix API enablement.`
      );
      return res.status(422).json({
        detail: "We couldn't calculate the driving distance for this route. Please check the pickup and drop-off addresses, or contact us at info@bookaride.co.nz / 0800 266 5274 for a quote.",
        reason: 'distance_unavailable',
      });
    }

    // Calculate price using the locked pricing engine
    const pricing = calculatePrice({
      distanceKm,
      pickupAddress,
      dropoffAddress,
      passengers,
      bookReturn,
      vipAirportPickup,
      oversizedLuggage,
    });

    return res.status(200).json(pricing);
  } catch (err) {
    if (err.code === 'DISTANCE_REQUIRED') {
      console.error(`CRITICAL: Pricing engine rejected call — ${err.message}`);
      return res.status(422).json({
        detail: "We couldn't calculate the driving distance for this route. Please check the addresses or contact us at info@bookaride.co.nz / 0800 266 5274 for a quote.",
        reason: 'distance_unavailable',
      });
    }
    console.error('Error calculating price:', err);
    return res.status(500).json({ detail: `Error calculating price: ${err.message}` });
  }
};
