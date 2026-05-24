/**
 * GET /api/bookings/search-all
 *
 * Searches across active bookings, archived bookings, and (optionally)
 * deleted bookings by reference number, name, or email. Used by the
 * admin global search box.
 *
 * Query: search (required), include_archived (default true),
 *        include_deleted (default false)
 */
const { findMany } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const search = (req.query.search || '').toString().toLowerCase().trim();
    const includeArchived = req.query.include_archived !== 'false';
    const includeDeleted = req.query.include_deleted === 'true';

    if (!search || search.length < 2) {
      return res.status(400).json({ detail: 'search must be at least 2 characters' });
    }

    const matches = (b) => {
      const ref = String(b.referenceNumber || '').toLowerCase();
      const name = String(b.name || `${b.firstName || ''} ${b.lastName || ''}`).toLowerCase();
      const email = String(b.email || '').toLowerCase();
      const phone = String(b.phone || '').toLowerCase();
      return ref.includes(search) || name.includes(search) || email.includes(search) || phone.includes(search);
    };

    const tag = (b, location) => ({ ...b, _location: location });

    const sources = [
      { collection: 'bookings', tag: 'active' },
    ];
    if (includeArchived) sources.push({ collection: 'bookings_archive', tag: 'archived' });
    if (includeDeleted) sources.push({ collection: 'deleted_bookings', tag: 'deleted' });

    const results = [];
    for (const source of sources) {
      const all = await findMany(source.collection, {}, { limit: 5000 });
      for (const b of all) {
        if (matches(b)) results.push(tag(b, source.tag));
      }
    }

    // Most recent first
    results.sort((a, b) => {
      const aDate = a.createdAt || a.archivedAt || a.deleted_at || '';
      const bDate = b.createdAt || b.archivedAt || b.deleted_at || '';
      return String(bDate).localeCompare(String(aDate));
    });

    return res.status(200).json({ results, total: results.length });
  } catch (err) {
    console.error('search-all error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
