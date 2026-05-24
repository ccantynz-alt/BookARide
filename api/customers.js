/**
 * GET /api/customers — List unique customers from bookings
 * Extracts customer info from bookings table (no separate customer collection).
 */
const { getDb } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const sql = getDb();
    const search = req.query.q || req.query.search || '';

    let rows;
    if (search) {
      rows = await sql`
        SELECT DISTINCT ON (LOWER(data->>'email'))
          data->>'name' as name,
          data->>'firstName' as first_name,
          data->>'lastName' as last_name,
          data->>'email' as email,
          data->>'phone' as phone,
          COUNT(*) OVER (PARTITION BY LOWER(data->>'email')) as booking_count,
          MAX(data->>'date') OVER (PARTITION BY LOWER(data->>'email')) as last_booking_date,
          SUM(CASE WHEN data->>'payment_status' = 'paid' THEN (data->>'totalPrice')::numeric ELSE 0 END) OVER (PARTITION BY LOWER(data->>'email')) as total_spent
        FROM bookings
        WHERE (data->>'name' ILIKE ${'%' + search + '%'}
           OR data->>'email' ILIKE ${'%' + search + '%'}
           OR data->>'phone' ILIKE ${'%' + search + '%'}
           OR data->>'firstName' ILIKE ${'%' + search + '%'}
           OR data->>'lastName' ILIKE ${'%' + search + '%'})
        ORDER BY LOWER(data->>'email'), created_at DESC
        LIMIT 100
      `;
    } else {
      rows = await sql`
        SELECT DISTINCT ON (LOWER(data->>'email'))
          data->>'name' as name,
          data->>'firstName' as first_name,
          data->>'lastName' as last_name,
          data->>'email' as email,
          data->>'phone' as phone,
          COUNT(*) OVER (PARTITION BY LOWER(data->>'email')) as booking_count,
          MAX(data->>'date') OVER (PARTITION BY LOWER(data->>'email')) as last_booking_date,
          SUM(CASE WHEN data->>'payment_status' = 'paid' THEN (data->>'totalPrice')::numeric ELSE 0 END) OVER (PARTITION BY LOWER(data->>'email')) as total_spent
        FROM bookings
        WHERE data->>'email' IS NOT NULL AND data->>'email' != ''
        ORDER BY LOWER(data->>'email'), created_at DESC
        LIMIT 500
      `;
    }

    const customers = rows.map(r => ({
      name: r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      email: r.email || '',
      phone: r.phone || '',
      bookingCount: parseInt(r.booking_count) || 0,
      lastBookingDate: r.last_booking_date || '',
      totalSpent: parseFloat(r.total_spent) || 0,
    }));

    return res.status(200).json(customers);
  } catch (err) {
    console.error('Error listing customers:', err.message);
    return res.status(500).json({ detail: `Error listing customers: ${err.message}` });
  }
};
