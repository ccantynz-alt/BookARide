/**
 * GET /api/places/autocomplete?input=...
 * Google Places Autocomplete for address search.
 * CRITICAL: This is the ONLY autocomplete provider. Google Maps JS
 * is NOT loaded in the browser. All suggestions come from here.
 */
const { autocomplete } = require('../_lib/google-maps');

// Common NZ addresses as fallback when Google API is unavailable
const NZ_FALLBACK_ADDRESSES = [
  { description: 'Auckland Airport (AKL), Ray Emery Drive, Mangere, Auckland 2022, New Zealand', place_id: 'f_akl' },
  { description: 'Auckland Domestic Terminal, George Bolt Memorial Drive, Mangere, Auckland, New Zealand', place_id: 'f_akl_dom' },
  { description: 'Auckland CBD, Auckland, New Zealand', place_id: 'f_akl_cbd' },
  { description: 'Britomart Transport Centre, Queen Street, Auckland CBD, New Zealand', place_id: 'f_britomart' },
  { description: 'SkyCity Auckland, Victoria Street, Auckland CBD, New Zealand', place_id: 'f_skycity' },
  { description: 'Viaduct Harbour, Auckland, New Zealand', place_id: 'f_viaduct' },
  { description: 'Ponsonby, Auckland, New Zealand', place_id: 'f_ponsonby' },
  { description: 'Parnell, Auckland, New Zealand', place_id: 'f_parnell' },
  { description: 'Newmarket, Auckland, New Zealand', place_id: 'f_newmarket' },
  { description: 'Grey Lynn, Auckland, New Zealand', place_id: 'f_greylynn' },
  { description: 'Mt Eden, Auckland, New Zealand', place_id: 'f_mteden' },
  { description: 'Remuera, Auckland, New Zealand', place_id: 'f_remuera' },
  { description: 'Ellerslie, Auckland, New Zealand', place_id: 'f_ellerslie' },
  { description: 'Penrose, Auckland, New Zealand', place_id: 'f_penrose' },
  { description: 'Mt Wellington, Auckland, New Zealand', place_id: 'f_mtwellington' },
  { description: 'Orewa, Auckland, New Zealand', place_id: 'f_orewa' },
  { description: 'Whangaparaoa, Auckland, New Zealand', place_id: 'f_whangaparaoa' },
  { description: 'Silverdale, Auckland, New Zealand', place_id: 'f_silverdale' },
  { description: 'Stanmore Bay, Auckland, New Zealand', place_id: 'f_stanmorebay' },
  { description: 'Gulf Harbour, Auckland, New Zealand', place_id: 'f_gulfharbour' },
  { description: 'Red Beach, Auckland, New Zealand', place_id: 'f_redbeach' },
  { description: 'Army Bay, Auckland, New Zealand', place_id: 'f_armybay' },
  { description: 'Millwater, Auckland, New Zealand', place_id: 'f_millwater' },
  { description: 'Albany, Auckland, New Zealand', place_id: 'f_albany' },
  { description: 'Takapuna, Auckland, New Zealand', place_id: 'f_takapuna' },
  { description: 'Devonport, Auckland, New Zealand', place_id: 'f_devonport' },
  { description: 'North Shore, Auckland, New Zealand', place_id: 'f_northshore' },
  { description: 'Manly, Auckland, New Zealand', place_id: 'f_manly' },
  { description: 'Henderson, Auckland, New Zealand', place_id: 'f_henderson' },
  { description: 'New Lynn, Auckland, New Zealand', place_id: 'f_newlynn' },
  { description: 'Waitakere, Auckland, New Zealand', place_id: 'f_waitakere' },
  { description: 'Botany, Auckland, New Zealand', place_id: 'f_botany' },
  { description: 'Howick, Auckland, New Zealand', place_id: 'f_howick' },
  { description: 'Manukau, Auckland, New Zealand', place_id: 'f_manukau' },
  { description: 'Papakura, Auckland, New Zealand', place_id: 'f_papakura' },
  { description: 'Pukekohe, Auckland, New Zealand', place_id: 'f_pukekohe' },
  { description: 'Warkworth, Auckland, New Zealand', place_id: 'f_warkworth' },
  { description: 'Matakana, Auckland, New Zealand', place_id: 'f_matakana' },
  { description: 'Waiwera, Auckland, New Zealand', place_id: 'f_waiwera' },
  { description: 'Hamilton, Waikato, New Zealand', place_id: 'f_hamilton' },
  { description: 'Tauranga, Bay of Plenty, New Zealand', place_id: 'f_tauranga' },
  { description: 'Mount Maunganui, Tauranga, New Zealand', place_id: 'f_mountmaunganui' },
  { description: 'Whangarei, Northland, New Zealand', place_id: 'f_whangarei' },
  { description: 'Cambridge, Waikato, New Zealand', place_id: 'f_cambridge' },
  { description: 'Rotorua, Bay of Plenty, New Zealand', place_id: 'f_rotorua' },
  { description: 'Hobbiton, Matamata, New Zealand', place_id: 'f_hobbiton' },
];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const input = (req.query.input || '').trim();
  if (!input || input.length < 2) {
    return res.status(200).json({ predictions: [] });
  }

  // Try Google Places API first (server-side)
  try {
    const predictions = await autocomplete(input);
    if (predictions.length > 0) {
      return res.status(200).json({ predictions, source: 'google' });
    }
    // Google returned 0 results — check if key is set
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY not set — autocomplete using fallback only');
    }
  } catch (err) {
    console.error('Google autocomplete failed:', err.message);
  }

  // Fallback: fuzzy match against static NZ addresses
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/);
  const scored = NZ_FALLBACK_ADDRESSES
    .map(a => {
      const desc = a.description.toLowerCase();
      const matchCount = words.filter(w => desc.includes(w)).length;
      return { ...a, score: matchCount };
    })
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return res.status(200).json({ predictions: scored, source: 'fallback' });
};
