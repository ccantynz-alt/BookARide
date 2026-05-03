/**
 * GET /api/bookings/archived
 *
 * List archived bookings with pagination. Used by the admin dashboard's
 * Archive tab.
 *
 * Query: page (default 1), limit (default 50), search (optional)
 */
const { findMany, countDocuments } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const search = (req.query.search || '').toString().toLowerCase().trim();
    const offset = (page - 1) * limit;

    let bookings = await findMany('bookings_archive', {}, {
      limit: search ? 1000 : limit,
      offset: search ? 0 : offset,
      sort: { archivedAt: -1 },
    });

    if (search) {
      bookings = bookings.filter(b => {
        const ref = String(b.referenceNumber || '').toLowerCase();
        const name = String(b.name || `${b.firstName || ''} ${b.lastName || ''}`).toLowerCase();
        const email = String(b.email || '').toLowerCase();
        return ref.includes(search) || name.includes(search) || email.includes(search);
      });
      const total = bookings.length;
      bookings = bookings.slice(offset, offset + limit);
      return res.status(200).json({
        bookings, total, page, totalPages: Math.ceil(total / limit) || 1,
      });
    }

    const total = await countDocuments('bookings_archive');
    return res.status(200).json({
      bookings, total, page, totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('Archived bookings error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
