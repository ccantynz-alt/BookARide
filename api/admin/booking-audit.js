/**
 * GET /api/admin/booking-audit
 * Comprehensive forensic audit of ALL bookings across all 3 collections
 * plus orphaned payment detection and data integrity checks.
 *
 * TEMPORARY diagnostic endpoint — DELETE after investigation is complete.
 */
const { getDb } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const sql = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    // ---------------------------------------------------------------
    // 1. Total counts across all 3 collections
    // ---------------------------------------------------------------
    const [[activeCount], [deletedCount], [archivedCount], [paymentCount]] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM bookings`,
      sql`SELECT COUNT(*) as cnt FROM deleted_bookings`,
      sql`SELECT COUNT(*) as cnt FROM bookings_archive`,
      sql`SELECT COUNT(*) as cnt FROM payment_transactions`,
    ]);

    const totals = {
      active_bookings: parseInt(activeCount.cnt),
      deleted_bookings: parseInt(deletedCount.cnt),
      archived_bookings: parseInt(archivedCount.cnt),
      payment_transactions: parseInt(paymentCount.cnt),
      grand_total_bookings: parseInt(activeCount.cnt) + parseInt(deletedCount.cnt) + parseInt(archivedCount.cnt),
    };

    // ---------------------------------------------------------------
    // 2. All bookings from last 30 days across all 3 collections
    // ---------------------------------------------------------------
    const [activeRecent, deletedRecent, archivedRecent] = await Promise.all([
      sql`
        SELECT data, 'active' as collection FROM bookings
        WHERE data->>'date' >= ${cutoffDate}
           OR created_at >= ${thirtyDaysAgo.toISOString()}
        ORDER BY created_at DESC
        LIMIT 500
      `,
      sql`
        SELECT data, 'deleted' as collection FROM deleted_bookings
        WHERE data->>'date' >= ${cutoffDate}
           OR created_at >= ${thirtyDaysAgo.toISOString()}
        ORDER BY created_at DESC
        LIMIT 500
      `,
      sql`
        SELECT data, 'archived' as collection FROM bookings_archive
        WHERE data->>'date' >= ${cutoffDate}
           OR created_at >= ${thirtyDaysAgo.toISOString()}
        ORDER BY created_at DESC
        LIMIT 500
      `,
    ]);

    function formatBooking(row) {
      const d = row.data;
      return {
        id: d.id,
        referenceNumber: d.referenceNumber || null,
        name: d.name || [d.firstName, d.lastName].filter(Boolean).join(' ') || null,
        email: d.email || null,
        phone: d.phone || null,
        date: d.date || null,
        time: d.time || null,
        pickupAddress: d.pickupAddress || null,
        dropoffAddress: d.dropoffAddress || null,
        status: d.status || null,
        payment_status: d.payment_status || null,
        payment_method: d.payment_method || null,
        totalPrice: d.totalPrice || null,
        serviceType: d.serviceType || null,
        createdAt: d.createdAt || d.created_at || null,
        collection: row.collection,
      };
    }

    const allRecent = [
      ...activeRecent.map(formatBooking),
      ...deletedRecent.map(formatBooking),
      ...archivedRecent.map(formatBooking),
    ].sort((a, b) => {
      const dateA = a.date || a.createdAt || '';
      const dateB = b.date || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    // ---------------------------------------------------------------
    // 3. Orphaned payments — payments with no matching booking anywhere
    // ---------------------------------------------------------------
    const orphanedPayments = await sql`
      SELECT pt.data as payment_data
      FROM payment_transactions pt
      WHERE pt.data->>'booking_id' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM bookings b WHERE b.id = pt.data->>'booking_id'
        )
        AND NOT EXISTS (
          SELECT 1 FROM deleted_bookings db WHERE db.id = pt.data->>'booking_id'
        )
        AND NOT EXISTS (
          SELECT 1 FROM bookings_archive ba WHERE ba.id = pt.data->>'booking_id'
        )
      ORDER BY pt.created_at DESC
      LIMIT 200
    `;

    const orphans = orphanedPayments.map(r => {
      const p = r.payment_data;
      return {
        payment_id: p.id || null,
        booking_id: p.booking_id || null,
        session_id: p.session_id || null,
        stripe_payment_intent: p.payment_intent || p.stripe_payment_intent || null,
        amount: p.amount || p.total || null,
        currency: p.currency || 'nzd',
        status: p.status || p.payment_status || null,
        customer_email: p.customer_email || p.email || null,
        customer_name: p.customer_name || p.name || null,
        created_at: p.createdAt || p.created_at || null,
        note: 'ORPHANED — payment exists but booking is missing from ALL collections',
      };
    });

    // ---------------------------------------------------------------
    // 4. Payment status mismatches — paid in Stripe but unpaid in booking
    // ---------------------------------------------------------------
    const mismatches = await sql`
      SELECT b.data as booking_data, pt.data as payment_data
      FROM payment_transactions pt
      JOIN bookings b ON b.id = pt.data->>'booking_id'
      WHERE (pt.data->>'status' = 'paid' OR pt.data->>'status' = 'complete' OR pt.data->>'status' = 'succeeded')
        AND (b.data->>'payment_status' IS NULL
             OR b.data->>'payment_status' = 'unpaid'
             OR b.data->>'payment_status' = 'pending')
      ORDER BY pt.created_at DESC
      LIMIT 100
    `;

    const paymentMismatches = mismatches.map(r => ({
      booking_id: r.booking_data.id,
      referenceNumber: r.booking_data.referenceNumber || null,
      name: r.booking_data.name || [r.booking_data.firstName, r.booking_data.lastName].filter(Boolean).join(' ') || null,
      email: r.booking_data.email || null,
      booking_payment_status: r.booking_data.payment_status || 'not set',
      stripe_payment_status: r.payment_data.status || null,
      amount: r.payment_data.amount || r.payment_data.total || null,
      note: 'MISMATCH — Stripe says paid but booking shows unpaid',
    }));

    // ---------------------------------------------------------------
    // 5. Duplicate reference numbers
    // ---------------------------------------------------------------
    const duplicatesActive = await sql`
      SELECT data->>'referenceNumber' as ref, COUNT(*) as cnt
      FROM bookings
      WHERE data->>'referenceNumber' IS NOT NULL
      GROUP BY data->>'referenceNumber'
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 50
    `;

    const duplicateRefs = duplicatesActive.map(r => ({
      referenceNumber: r.ref,
      count: parseInt(r.cnt),
      note: 'DUPLICATE — multiple active bookings share this reference number',
    }));

    // Also check cross-collection duplicates (same booking ID in multiple tables)
    const crossCollectionDupes = await sql`
      SELECT b.id, 'active+deleted' as overlap
      FROM bookings b
      JOIN deleted_bookings db ON db.id = b.id
      UNION ALL
      SELECT b.id, 'active+archived' as overlap
      FROM bookings b
      JOIN bookings_archive ba ON ba.id = b.id
      UNION ALL
      SELECT db.id, 'deleted+archived' as overlap
      FROM deleted_bookings db
      JOIN bookings_archive ba ON ba.id = db.id
      LIMIT 50
    `;

    const crossDupes = crossCollectionDupes.map(r => ({
      booking_id: r.id,
      overlap: r.overlap,
      note: 'DANGER — same booking exists in multiple collections',
    }));

    // ---------------------------------------------------------------
    // 6. Bookings with missing critical fields
    // ---------------------------------------------------------------
    const [missingEmail, missingPickup, missingDate] = await Promise.all([
      sql`
        SELECT data, 'active' as collection FROM bookings
        WHERE (data->>'email' IS NULL OR data->>'email' = '')
        ORDER BY created_at DESC LIMIT 50
      `,
      sql`
        SELECT data, 'active' as collection FROM bookings
        WHERE (data->>'pickupAddress' IS NULL OR data->>'pickupAddress' = '')
        ORDER BY created_at DESC LIMIT 50
      `,
      sql`
        SELECT data, 'active' as collection FROM bookings
        WHERE (data->>'date' IS NULL OR data->>'date' = '')
        ORDER BY created_at DESC LIMIT 50
      `,
    ]);

    const missingFields = [];
    for (const row of missingEmail) {
      missingFields.push({
        id: row.data.id,
        referenceNumber: row.data.referenceNumber || null,
        name: row.data.name || null,
        missing: 'email',
        collection: row.collection,
      });
    }
    for (const row of missingPickup) {
      missingFields.push({
        id: row.data.id,
        referenceNumber: row.data.referenceNumber || null,
        name: row.data.name || null,
        email: row.data.email || null,
        missing: 'pickupAddress',
        collection: row.collection,
      });
    }
    for (const row of missingDate) {
      missingFields.push({
        id: row.data.id,
        referenceNumber: row.data.referenceNumber || null,
        name: row.data.name || null,
        email: row.data.email || null,
        missing: 'date',
        collection: row.collection,
      });
    }

    // ---------------------------------------------------------------
    // 7. Summary
    // ---------------------------------------------------------------
    const summary = {
      message: [
        `${allRecent.filter(b => b.collection === 'active').length} active bookings in last 30 days`,
        `${allRecent.filter(b => b.collection === 'deleted').length} deleted bookings in last 30 days`,
        `${allRecent.filter(b => b.collection === 'archived').length} archived bookings in last 30 days`,
        `${orphans.length} orphaned payments (booking MISSING from all collections)`,
        `${paymentMismatches.length} payment status mismatches (Stripe=paid, booking=unpaid)`,
        `${duplicateRefs.length} duplicate reference numbers`,
        `${crossDupes.length} cross-collection duplicates (booking in multiple tables)`,
        `${missingFields.length} bookings with missing critical fields`,
      ].join(' | '),
      severity: orphans.length > 0 || paymentMismatches.length > 0 || crossDupes.length > 0
        ? 'CRITICAL — lost bookings or data corruption detected'
        : missingFields.length > 0 || duplicateRefs.length > 0
          ? 'WARNING — data quality issues found'
          : 'OK — no issues detected',
      audit_timestamp: now.toISOString(),
      audit_range: `Last 30 days (since ${cutoffDate})`,
    };

    return res.status(200).json({
      summary,
      totals,
      recent_bookings_last_30_days: allRecent,
      orphaned_payments: orphans,
      payment_status_mismatches: paymentMismatches,
      duplicate_reference_numbers: duplicateRefs,
      cross_collection_duplicates: crossDupes,
      missing_critical_fields: missingFields,
    });
  } catch (err) {
    console.error('Booking audit error:', err.message);
    return res.status(500).json({
      detail: 'Audit query failed: ' + err.message,
      hint: 'Check DATABASE_URL is set and Neon database is reachable',
    });
  }
};
