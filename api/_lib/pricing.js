/**
 * BookARide NZ — Pricing Engine (serverless)
 *
 * LOCKED RATES — DO NOT CHANGE WITHOUT OWNER APPROVAL.
 * These match the WordPress pricing plugin (verified 2026-03-13).
 */

// Tiered per-km rates (bracket-based — entire distance charged at ONE rate)
const PRICING_TIERS = [
  { maxKm: 15.0, rate: 12.00 },
  { maxKm: 15.8, rate: 8.00 },
  { maxKm: 16.0, rate: 6.00 },
  { maxKm: 25.5, rate: 5.50 },
  { maxKm: 35.0, rate: 5.00 },
  { maxKm: 50.0, rate: 3.13 },
  { maxKm: 60.0, rate: 2.60 },
  { maxKm: 75.0, rate: 2.84 },
  { maxKm: 100.0, rate: 2.70 },
  { maxKm: Infinity, rate: 3.50 },
];

function getRatePerKm(distanceKm) {
  for (const tier of PRICING_TIERS) {
    if (distanceKm <= tier.maxKm) return tier.rate;
  }
  return 3.50; // 100km+ fallback
}

// ===========================================
// TEMPORARY FUEL SURCHARGE (April 2026)
// Diesel up 85% ($1.85 -> $3.43/L), petrol up 36% in 28 days
// due to Iran conflict disrupting Strait of Hormuz.
// SET TO 0 WHEN FUEL PRICES NORMALISE.
// ===========================================
const FUEL_SURCHARGE_PERCENT = 12; // 12% blanket surcharge on all bookings

// Add-on fees
const VIP_AIRPORT_PICKUP_FEE = 15.0;
const OVERSIZED_LUGGAGE_FEE = 25.0;
const EXTRA_PASSENGER_FEE = 5.0; // per additional (1st included)
const MINIMUM_ONE_WAY = 150.0;
const MATAKANA_CONCERT_BASE = 550.0;

// Zone keywords for address matching
const HIBISCUS_COAST_KEYWORDS = [
  'orewa', 'whangaparaoa', 'silverdale', 'red beach', 'stanmore bay',
  'army bay', 'gulf harbour', 'manly', 'hibiscus coast', 'millwater',
  'milldale', 'hatfields beach', 'waiwera', 'alec craig', 'orewa beach',
  'stillwater', 'coatesville',
];

const AIRPORT_KEYWORDS = ['airport', 'auckland airport', 'akl', 'ray emery', 'mangere'];

const MATAKANA_CONCERT_KEYWORDS = [
  'matakana country park', 'matakana country club', 'rd5/1151', '1151 leigh road',
];

function norm(s) {
  return (s || '').toLowerCase().replace(/\u0101/g, 'a');
}

function matchesAny(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

/**
 * Calculate price for a booking.
 *
 * NO FALLBACKS. distanceKm MUST be the actual Google Maps driving distance.
 * If the caller can't get a real distance, it MUST refuse to quote — never
 * guess with a default km value. Silent fallbacks overcharged customers
 * (75 km default produced $245 quotes for short trips) — owner banned them
 * 2026-04-16.
 *
 * @param {Object} params
 * @param {number} params.distanceKm - REQUIRED actual driving distance in km
 * @param {string} params.pickupAddress
 * @param {string} params.dropoffAddress
 * @param {number} params.passengers - Total passengers (1st included)
 * @param {boolean} params.bookReturn - Return trip?
 * @param {boolean} params.vipAirportPickup
 * @param {boolean} params.oversizedLuggage
 * @returns {Object} Pricing breakdown
 */
function calculatePrice({
  distanceKm,
  pickupAddress,
  dropoffAddress,
  passengers = 1,
  bookReturn = false,
  vipAirportPickup = false,
  oversizedLuggage = false,
}) {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    const err = new Error(
      'distanceKm is required and must be a positive number. ' +
      'NO fallback distances are permitted — the caller must obtain the actual ' +
      'driving distance from Google Maps before calling calculatePrice.'
    );
    err.code = 'DISTANCE_REQUIRED';
    throw err;
  }

  const pickupLower = norm(pickupAddress);
  const dropoffLower = norm(dropoffAddress);

  let distance = distanceKm;

  // Concert pricing check
  const isConcertDest = matchesAny(dropoffLower, MATAKANA_CONCERT_KEYWORDS);
  const isConcertPickup = matchesAny(pickupLower, MATAKANA_CONCERT_KEYWORDS);
  const isConcertTrip = isConcertDest || isConcertPickup;
  const isFromHibiscus = matchesAny(pickupLower, HIBISCUS_COAST_KEYWORDS);
  const isToHibiscus = matchesAny(dropoffLower, HIBISCUS_COAST_KEYWORDS);

  // Standard pricing
  const ratePerKm = getRatePerKm(distance);
  let basePrice = distance * ratePerKm;

  const airportFee = vipAirportPickup ? VIP_AIRPORT_PICKUP_FEE : 0;
  const luggageFee = oversizedLuggage ? OVERSIZED_LUGGAGE_FEE : 0;
  const extraPassengers = Math.max(0, passengers - 1);
  const passengerFee = extraPassengers * EXTRA_PASSENGER_FEE;

  let totalPrice = basePrice + airportFee + luggageFee + passengerFee;

  // Concert special pricing
  if (isConcertTrip) {
    if (isFromHibiscus || isToHibiscus) {
      totalPrice = Math.max(totalPrice, MATAKANA_CONCERT_BASE);
    } else {
      const distToHibiscus = Math.min(distance, 40.0);
      const rateToHibiscus = getRatePerKm(distToHibiscus);
      const priceToHibiscus = distToHibiscus * rateToHibiscus;
      totalPrice = priceToHibiscus + MATAKANA_CONCERT_BASE + airportFee + luggageFee + passengerFee;
    }
  } else if (totalPrice < MINIMUM_ONE_WAY) {
    totalPrice = MINIMUM_ONE_WAY;
  }

  const oneWaySubtotal = Math.round(totalPrice * 100) / 100;

  // Return trip
  let subtotal;
  if (bookReturn) {
    if (isConcertTrip && (isFromHibiscus || isToHibiscus)) {
      subtotal = oneWaySubtotal; // Concert flat $550 is already return
    } else {
      subtotal = Math.round(2 * Math.max(oneWaySubtotal, MINIMUM_ONE_WAY) * 100) / 100;
      distance *= 2;
      basePrice *= 2;
    }
  } else {
    subtotal = oneWaySubtotal;
  }

  // Temporary fuel surcharge (blanket % on subtotal)
  const fuelSurcharge = FUEL_SURCHARGE_PERCENT > 0
    ? Math.round(subtotal * (FUEL_SURCHARGE_PERCENT / 100) * 100) / 100
    : 0;
  const subtotalWithFuel = Math.round((subtotal + fuelSurcharge) * 100) / 100;

  // Stripe processing fee (2.9% + $0.30 NZD) passed to customer
  const stripeFee = Math.round(((subtotalWithFuel * 0.029) + 0.30) * 100) / 100;
  const totalWithStripe = Math.round((subtotalWithFuel + stripeFee) * 100) / 100;

  return {
    distance: Math.round(distance * 100) / 100,
    basePrice: Math.round(basePrice * 100) / 100,
    airportFee: Math.round((bookReturn ? airportFee * 2 : airportFee) * 100) / 100,
    oversizedLuggageFee: Math.round((bookReturn ? luggageFee * 2 : luggageFee) * 100) / 100,
    passengerFee: Math.round((bookReturn ? passengerFee * 2 : passengerFee) * 100) / 100,
    fuelSurcharge,
    fuelSurchargePercent: FUEL_SURCHARGE_PERCENT,
    stripeFee,
    subtotal: subtotalWithFuel,
    totalPrice: totalWithStripe,
    ratePerKm: Math.round(ratePerKm * 100) / 100,
  };
}

module.exports = { calculatePrice, getRatePerKm, PRICING_TIERS };
