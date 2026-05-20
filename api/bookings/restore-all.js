/**
 * POST /api/bookings/restore-all
 *
 * Restore EVERY soft-deleted booking back to active bookings. Used by
 * the admin "Restore everything" button after an accidental bulk delete.
 *
 * ZERO BOOKING LOSS: per-record verify before delete (CLAUDE.md Rule 1).
 * If any single restore fails, the booking stays in deleted_bookings;
 * we do NOT abort the whole batch on one failure.
 */
const { findMany, findOne, insertOne, deleteOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const deleted = await findMany('deleted_bookings', {}, { limit: 5000 });

    let restoredCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const booking of deleted) {
      try {
        // Skip if already in active bookings (shouldn't happen but be defensive)
        const existing = await findOne('bookings', { id: booking.id });
        if (existing) {
          skippedCount++;
          continue;
        }

        const restoredBooking = { ...booking };
        delete restoredBooking.deleted_at;
        restoredBooking.restored_at = new Date().toISOString();
        restoredBooking.updatedAt = new Date().toISOString();

        const result = await insertOne('bookings', restoredBooking);
        if (!result.acknowledged) {
          errors.push({ id: booking.id, error: 'insert not acknowledged' });
          continue;
        }

        const verified = await findOne('bookings', { id: booking.id });
        if (!verified) {
          errors.push({ id: booking.id, error: 'verification failed' });
          continue;
        }

        await deleteOne('deleted_bookings', { id: booking.id });
        restoredCount++;
      } catch (err) {
        console.error(`CRITICAL: restore-all failed for ${booking.id}: ${err.message}`);
        errors.push({ id: booking.id, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      restored_count: restoredCount,
      skipped_count: skippedCount,
      error_count: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error('restore-all error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
