/**
 * GET /api/bookings/deleted
 * List soft-deleted bookings (admin).
 */
const { findMany } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const bookings = await findMany('deleted_bookings', {}, {
      limit: 200,
      sort: { createdAt: -1 },
    });
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('List deleted bookings error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
