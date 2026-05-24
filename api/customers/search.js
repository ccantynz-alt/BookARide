/**
 * GET /api/customers/search?q=...
 *
 * Customer autocomplete for the admin Create Booking modal.
 * Searches the bookings table for matching customers (name, email, phone)
 * and returns deduplicated results so the admin can pre-fill the form.
 *
 * Response shape MUST be { customers: [...] } — the frontend in
 * CreateBookingModal.jsx reads response.data.customers, so a bare array
 * would not work. See CLAUDE.md for the locked schema.
 */
const { findMany } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(200).json({ customers: [] });
    }

    // Pull a wide set of recent bookings and filter in-memory.
    // The bookings table is JSONB so we can't easily index name/email/phone
    // for partial-match without trigram extensions. For an admin search
    // dropdown over a few thousand bookings this is fast enough.
    const bookings = await findMany('bookings', {}, { limit: 2000, sort: { createdAt: -1 } });

    const needle = q.toLowerCase();
    const matched = bookings.filter(b => {
      if (!b) return false;
      const name = String(b.name || '').toLowerCase();
      const email = String(b.email || '').toLowerCase();
      const phone = String(b.phone || '').toLowerCase();
      return name.includes(needle) || email.includes(needle) || phone.includes(needle);
    });

    // Deduplicate by email — most recent booking wins (already sorted desc)
    const seen = new Map();
    for (const b of matched) {
      const key = String(b.email || '').toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        // Just bump the booking count
        const existing = seen.get(key);
        existing.totalBookings += 1;
        continue;
      }
      seen.set(key, {
        name: b.name || '',
        email: b.email || '',
        phone: b.phone || '',
        pickupAddress: b.pickupAddress || '',
        dropoffAddress: b.dropoffAddress || '',
        lastBookingDate: b.date || '',
        totalBookings: 1,
      });
    }

    const customers = Array.from(seen.values()).slice(0, 10);

    return res.status(200).json({ customers });
  } catch (err) {
    console.error('Customer search error:', err.message);
    return res.status(500).json({ detail: `Customer search failed: ${err.message}` });
  }
};
