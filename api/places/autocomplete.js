/**
 * GET /api/places/autocomplete?input=...
 * Google Places Autocomplete for address search.
 * Replaces: Python backend GET /api/places/autocomplete
 */
const { autocomplete } = require('../_lib/google-maps');

// Common NZ addresses as fallback when Google API is unavailable
const NZ_FALLBACK_ADDRESSES = [
  { description: 'Auckland Airport (AKL), Ray Emery Drive, Mangere, Auckland 2022, New Zealand', place_id: 'fallback_akl' },
  { description: 'Auckland Domestic Terminal, George Bolt Memorial Drive, Mangere, Auckland, New Zealand', place_id: 'fallback_akl_domestic' },
  { description: 'Auckland CBD, Auckland, New Zealand', place_id: 'fallback_akl_cbd' },
  { description: 'Britomart Transport Centre, Queen Street, Auckland CBD, New Zealand', place_id: 'fallback_britomart' },
  { description: 'SkyCity Auckland, Victoria Street, Auckland CBD, New Zealand', place_id: 'fallback_skycity' },
  { description: 'Viaduct Harbour, Auckland, New Zealand', place_id: 'fallback_viaduct' },
  { description: 'Orewa, Auckland, New Zealand', place_id: 'fallback_orewa' },
  { description: 'Whangaparaoa, Auckland, New Zealand', place_id: 'fallback_whangaparaoa' },
  { description: 'Silverdale, Auckland, New Zealand', place_id: 'fallback_silverdale' },
  { description: 'Albany, Auckland, New Zealand', place_id: 'fallback_albany' },
  { description: 'Takapuna, Auckland, New Zealand', place_id: 'fallback_takapuna' },
  { description: 'Hamilton, Waikato, New Zealand', place_id: 'fallback_hamilton' },
  { description: 'Tauranga, Bay of Plenty, New Zealand', place_id: 'fallback_tauranga' },
];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const input = (req.query.input || '').trim();
  if (!input || input.length < 2) {
    return res.status(200).json({ predictions: [] });
  }

  // Try Google Places first
  const predictions = await autocomplete(input);
  if (predictions.length > 0) {
    return res.status(200).json({ predictions, source: 'google' });
  }

  // Fallback: filter static NZ addresses
  const lower = input.toLowerCase();
  const filtered = NZ_FALLBACK_ADDRESSES.filter(a =>
    a.description.toLowerCase().includes(lower)
  );

  return res.status(200).json({ predictions: filtered, source: 'fallback' });
};
