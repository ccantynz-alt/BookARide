/**
 * Google Maps API helpers for distance calculation and autocomplete.
 * Uses Google Maps API ONLY — no Geoapify.
 */

/**
 * Get driving distance in km via Google Maps Distance Matrix / Directions API.
 * Returns null on failure (caller should use fallback).
 */
async function getDistance(pickupAddress, dropoffAddress, waypointAddresses = []) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set — using fallback distance');
    return null;
  }

  try {
    const extra = (waypointAddresses || []).filter(a => a && a.trim());

    if (extra.length > 0) {
      // Use Directions API for waypoint support
      const params = new URLSearchParams({
        origin: pickupAddress,
        destination: dropoffAddress,
        waypoints: extra.join('|'),
        key: apiKey,
        region: 'nz',
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
      const data = await res.json();
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const totalMeters = data.routes[0].legs.reduce(
          (sum, leg) => sum + (leg.distance?.value || 0), 0
        );
        return Math.round((totalMeters / 1000) * 100) / 100;
      }
    } else {
      // Simple origin->destination: use Distance Matrix
      const params = new URLSearchParams({
        origins: pickupAddress,
        destinations: dropoffAddress,
        key: apiKey,
        region: 'nz',
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
      const data = await res.json();
      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const distMeters = data.rows[0].elements[0].distance.value;
        return Math.round((distMeters / 1000) * 100) / 100;
      }
    }
  } catch (err) {
    console.error('Google Maps distance error:', err.message);
  }

  return null;
}

/**
 * Google Places Autocomplete — returns address predictions.
 */
async function autocomplete(input) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      input,
      key: apiKey,
      components: 'country:nz',
      types: 'geocode|establishment',
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.predictions.map(p => ({
        description: p.description,
        place_id: p.place_id,
      }));
    }
  } catch (err) {
    console.error('Google Places autocomplete error:', err.message);
  }

  return [];
}

module.exports = { getDistance, autocomplete };
