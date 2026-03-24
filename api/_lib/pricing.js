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
  { maxKm: 50.0, rate: 4.00 },
  { maxKm: 60.0, rate: 2.60 },
  { maxKm: 75.0, rate: 2.47 },
  { maxKm: 100.0, rate: 2.70 },
  { maxKm: Infinity, rate: 3.50 },
];

function getRatePerKm(distanceKm) {
  for (const tier of PRICING_TIERS) {
    if (distanceKm <= tier.maxKm) return tier.rate;
  }
  return 3.50; // 100km+ fallback
}

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

const LONG_DISTANCE_KEYWORDS = [
  'tauranga', 'mount maunganui', 'papamoa', 'otumoetai', 'bay of plenty',
  'hamilton', 'whangarei', 'cambridge', 'te awamutu',
];

const NORTH_AUCKLAND_KEYWORDS = [
  'warkworth', 'snells beach', 'matakana', 'leigh', 'wellsford', 'puhoi', 'alberton',
];

const HAMILTON_KEYWORDS = [
  'hamilton', 'frankton', 'hillcrest', 'rototuna', 'cambridge', 'te awamutu', 'ngaruawahia',
];

const WHANGAREI_KEYWORDS = [
  'whangarei', 'onerahi', 'kensington', 'tikipunga', 'regent', 'whangarei heads',
];

const TAURANGA_KEYWORDS = [
  'tauranga', 'mount maunganui', 'papamoa', 'te puna', 'omokoroa', 'bethlehem',
  'welcome bay', 'otumoetai', 'greerton', 'bay of plenty', 'tauriko', 'katikati', 'waihi beach',
];

const DEFAULT_FALLBACK_KM = 75.0;
const LONG_DISTANCE_FALLBACK_KM = 200.0;

function norm(s) {
  return (s || '').toLowerCase().replace(/\u0101/g, 'a');
}

function matchesAny(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

/**
 * Calculate price for a booking.
 *
 * @param {Object} params
 * @param {number} params.distanceKm - Distance from Google Maps (or null for fallback)
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
  const pickupLower = norm(pickupAddress);
  const dropoffLower = norm(dropoffAddress);

  // Determine fallback distance if Google Maps didn't return one
  const isLongDistance = matchesAny(pickupLower, LONG_DISTANCE_KEYWORDS)
    || matchesAny(dropoffLower, LONG_DISTANCE_KEYWORDS);
  const isHibiscusToAirport =
    (matchesAny(pickupLower, HIBISCUS_COAST_KEYWORDS) && matchesAny(dropoffLower, AIRPORT_KEYWORDS))
    || (matchesAny(dropoffLower, HIBISCUS_COAST_KEYWORDS) && matchesAny(pickupLower, AIRPORT_KEYWORDS));

  let fallbackKm = DEFAULT_FALLBACK_KM;
  if (isLongDistance) fallbackKm = LONG_DISTANCE_FALLBACK_KM;
  else if (isHibiscusToAirport) fallbackKm = 55.0;

  let distance = distanceKm != null ? distanceKm : fallbackKm;

  // Zone minimum distances
  const isToAirport = matchesAny(dropoffLower, AIRPORT_KEYWORDS);
  const isFromAirport = matchesAny(pickupLower, AIRPORT_KEYWORDS);

  if (matchesAny(pickupLower, NORTH_AUCKLAND_KEYWORDS) || matchesAny(dropoffLower, NORTH_AUCKLAND_KEYWORDS)) {
    if ((matchesAny(pickupLower, NORTH_AUCKLAND_KEYWORDS) && isToAirport) ||
        (matchesAny(dropoffLower, NORTH_AUCKLAND_KEYWORDS) && isFromAirport)) {
      distance = Math.max(distance, 65.0);
    }
  }
  if ((matchesAny(pickupLower, HAMILTON_KEYWORDS) && isToAirport) ||
      (matchesAny(dropoffLower, HAMILTON_KEYWORDS) && isFromAirport)) {
    distance = Math.max(distance, 125.0);
  }
  if ((matchesAny(pickupLower, WHANGAREI_KEYWORDS) && isToAirport) ||
      (matchesAny(dropoffLower, WHANGAREI_KEYWORDS) && isFromAirport)) {
    distance = Math.max(distance, 182.0);
  }
  if ((matchesAny(pickupLower, TAURANGA_KEYWORDS) && isToAirport) ||
      (matchesAny(dropoffLower, TAURANGA_KEYWORDS) && isFromAirport)) {
    distance = Math.max(distance, 200.0);
  }

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

  // Stripe processing fee (2.9% + $0.30 NZD) passed to customer
  const stripeFee = Math.round(((subtotal * 0.029) + 0.30) * 100) / 100;
  const totalWithStripe = Math.round((subtotal + stripeFee) * 100) / 100;

  return {
    distance: Math.round(distance * 100) / 100,
    basePrice: Math.round(basePrice * 100) / 100,
    airportFee: Math.round((bookReturn ? airportFee * 2 : airportFee) * 100) / 100,
    oversizedLuggageFee: Math.round((bookReturn ? luggageFee * 2 : luggageFee) * 100) / 100,
    passengerFee: Math.round((bookReturn ? passengerFee * 2 : passengerFee) * 100) / 100,
    stripeFee,
    subtotal,
    totalPrice: totalWithStripe,
    ratePerKm: Math.round(ratePerKm * 100) / 100,
  };
}

module.exports = { calculatePrice, getRatePerKm, PRICING_TIERS };
