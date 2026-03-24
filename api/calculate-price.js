/**
 * POST /api/calculate-price
 * Calculate booking price based on pickup/dropoff addresses.
 * Replaces: Python backend POST /api/calculate-price
 */
const { calculatePrice } = require('./lib/pricing');
const { getDistance } = require('./lib/google-maps');

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

    // Get distance from Google Maps
    const waypointAddrs = (pickupAddresses || []).filter(a => a && a.trim());
    const distanceKm = await getDistance(pickupAddress, dropoffAddress, waypointAddrs);

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
    console.error('Error calculating price:', err);
    return res.status(500).json({ detail: `Error calculating price: ${err.message}` });
  }
};
