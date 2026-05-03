/**
 * POST /api/bookings/restore-backup
 *
 * Body: { bookings: [...] } — array of booking documents to insert.
 * Used by the admin "Restore from backup file" flow. Skips any booking
 * whose id already exists in the active table (idempotent).
 */
const { findOne, insertOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const body = req.body || {};
    const bookings = Array.isArray(body.bookings) ? body.bookings : null;
    if (!bookings || bookings.length === 0) {
      return res.status(400).json({ detail: 'Body must contain a non-empty bookings array' });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const incoming of bookings) {
      try {
        if (!incoming || !incoming.id) {
          errors.push({ error: 'booking missing id', booking: incoming });
          continue;
        }

        const existing = await findOne('bookings', { id: incoming.id });
        if (existing) {
          skippedCount++;
          continue;
        }

        incoming.restoredFromBackupAt = new Date().toISOString();
        const result = await insertOne('bookings', incoming);
        if (!result.acknowledged) {
          errors.push({ id: incoming.id, error: 'insert not acknowledged' });
          continue;
        }
        importedCount++;
      } catch (err) {
        console.error(`CRITICAL: restore-backup failed for ${incoming?.id}: ${err.message}`);
        errors.push({ id: incoming?.id, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      imported_count: importedCount,
      skipped_count: skippedCount,
      error_count: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error('restore-backup error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
