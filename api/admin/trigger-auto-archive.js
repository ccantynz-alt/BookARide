/**
 * POST /api/admin/trigger-auto-archive
 *
 * Manually trigger archival of completed bookings whose service date
 * is more than 30 days in the past. Used by the admin "Run auto-archive"
 * button.
 *
 * ZERO BOOKING LOSS: per-record verify before delete (CLAUDE.md Rule 1).
 */
const { findMany, findOne, insertOne, deleteOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

const ARCHIVE_AFTER_DAYS = 30;

function parseDateString(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + 'T00:00:00');
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const cutoff = new Date(Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const all = await findMany('bookings', {}, { limit: 5000 });

    let archivedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const booking of all) {
      try {
        if (booking.status !== 'completed') { skippedCount++; continue; }
        const bookingDate = parseDateString(booking.date);
        if (!bookingDate || bookingDate >= cutoff) { skippedCount++; continue; }

        booking.archivedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();

        const result = await insertOne('bookings_archive', booking);
        if (!result.acknowledged) {
          errors.push({ id: booking.id, error: 'insert not acknowledged' });
          continue;
        }
        const verified = await findOne('bookings_archive', { id: booking.id });
        if (!verified) {
          errors.push({ id: booking.id, error: 'verification failed' });
          continue;
        }
        await deleteOne('bookings', { id: booking.id });
        archivedCount++;
      } catch (err) {
        console.error(`CRITICAL: auto-archive failed for ${booking.id}: ${err.message}`);
        errors.push({ id: booking.id, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      archived: archivedCount,
      skipped: skippedCount,
      errors: errors.length,
      threshold_days: ARCHIVE_AFTER_DAYS,
    });
  } catch (err) {
    console.error('trigger-auto-archive error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
