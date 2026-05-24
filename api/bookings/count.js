/**
 * GET /api/bookings/count
 * Return booking counts by status (for admin dashboard badges).
 */
const { rawQuery } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    // Single query: count bookings by status, excluding shared-shuttle
    const rows = await rawQuery(`
      SELECT
        data->>'status' as status,
        COUNT(*) as cnt
      FROM bookings
      WHERE data->>'serviceType' != 'shared-shuttle' OR data->>'serviceType' IS NULL
      GROUP BY data->>'status'
    `);

    const counts = {};
    let total = 0;
    for (const row of rows) {
      const status = row.status || 'unknown';
      const count = parseInt(row.cnt, 10);
      counts[status] = count;
      total += count;
    }

    return res.status(200).json({
      total,
      pending: counts.pending || 0,
      pending_approval: counts.pending_approval || 0,
      confirmed: counts.confirmed || 0,
      completed: counts.completed || 0,
      cancelled: counts.cancelled || 0,
      no_show: counts.no_show || 0,
    });
  } catch (err) {
    console.error('Booking count error:', err.message);
    return res.status(500).json({ detail: `Error counting bookings: ${err.message}` });
  }
};
