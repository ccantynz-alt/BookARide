/**
 * GET /api/admin/booking-check
 * TEMPORARY diagnostic — search bookings by name to verify they exist in the database.
 * DELETE THIS FILE after confirming bookings are intact.
 */
const { getDb } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const sql = getDb();
    const search = req.query.search || '';

    // Count total bookings in each collection
    const [totalBookings] = await sql`SELECT COUNT(*) as cnt FROM bookings`;
    const [totalDeleted] = await sql`SELECT COUNT(*) as cnt FROM deleted_bookings`;
    const [totalArchived] = await sql`SELECT COUNT(*) as cnt FROM bookings_archive`;

    let searchResults = [];
    if (search) {
      const rows = await sql`
        SELECT data FROM bookings
        WHERE data->>'name' ILIKE ${'%' + search + '%'}
           OR data->>'email' ILIKE ${'%' + search + '%'}
           OR data->>'phone' ILIKE ${'%' + search + '%'}
           OR data->>'firstName' ILIKE ${'%' + search + '%'}
           OR data->>'lastName' ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
        LIMIT 10
      `;
      searchResults = rows.map(r => ({
        id: r.data.id,
        name: r.data.name || `${r.data.firstName || ''} ${r.data.lastName || ''}`.trim(),
        email: r.data.email,
        phone: r.data.phone,
        date: r.data.date,
        time: r.data.time,
        pickupAddress: r.data.pickupAddress,
        dropoffAddress: r.data.dropoffAddress,
        status: r.data.status,
        payment_status: r.data.payment_status,
        totalPrice: r.data.totalPrice,
        referenceNumber: r.data.referenceNumber,
        paymentLink: `https://www.bookaride.co.nz/pay/${r.data.id}`,
      }));

      // Also check deleted_bookings
      const deletedRows = await sql`
        SELECT data FROM deleted_bookings
        WHERE data->>'name' ILIKE ${'%' + search + '%'}
           OR data->>'email' ILIKE ${'%' + search + '%'}
           OR data->>'firstName' ILIKE ${'%' + search + '%'}
           OR data->>'lastName' ILIKE ${'%' + search + '%'}
        LIMIT 10
      `;
      for (const r of deletedRows) {
        searchResults.push({
          id: r.data.id,
          name: r.data.name || `${r.data.firstName || ''} ${r.data.lastName || ''}`.trim(),
          email: r.data.email,
          status: 'DELETED',
          payment_status: r.data.payment_status,
          note: 'Found in deleted_bookings — can be restored',
        });
      }

      // Also check archive
      const archivedRows = await sql`
        SELECT data FROM bookings_archive
        WHERE data->>'name' ILIKE ${'%' + search + '%'}
           OR data->>'email' ILIKE ${'%' + search + '%'}
           OR data->>'firstName' ILIKE ${'%' + search + '%'}
           OR data->>'lastName' ILIKE ${'%' + search + '%'}
        LIMIT 10
      `;
      for (const r of archivedRows) {
        searchResults.push({
          id: r.data.id,
          name: r.data.name || `${r.data.firstName || ''} ${r.data.lastName || ''}`.trim(),
          email: r.data.email,
          status: 'ARCHIVED',
          payment_status: r.data.payment_status,
          note: 'Found in bookings_archive — can be unarchived',
        });
      }
    }

    return res.status(200).json({
      database_totals: {
        active_bookings: parseInt(totalBookings.cnt),
        deleted_bookings: parseInt(totalDeleted.cnt),
        archived_bookings: parseInt(totalArchived.cnt),
      },
      search_query: search || '(none — add ?search=name to search)',
      results: searchResults,
    });
  } catch (err) {
    console.error('Booking check error:', err.message);
    return res.status(500).json({ detail: 'Database query failed: ' + err.message });
  }
};
