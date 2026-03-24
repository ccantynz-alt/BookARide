/**
 * POST /api/bookings/restore/:bookingId
 * Restore a soft-deleted booking back to active bookings.
 * ZERO BOOKING LOSS: verify insert before deleting from deleted_bookings.
 */
const { findOne, insertOne, deleteOne } = require('../../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).json({ detail: 'bookingId is required' });
  }

  try {
    const booking = await findOne('deleted_bookings', { id: bookingId });
    if (!booking) {
      return res.status(404).json({ detail: 'Deleted booking not found' });
    }

    // Remove deletion metadata
    delete booking.deleted_at;
    booking.restored_at = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    // Step 1: Insert back into active bookings
    const result = await insertOne('bookings', booking);
    if (!result.acknowledged) {
      console.error(`CRITICAL: Failed to restore booking ${bookingId} — insert not acknowledged`);
      return res.status(500).json({ detail: 'Restore failed — booking stays in deleted' });
    }

    // Step 2: Verify it's in active bookings
    const verified = await findOne('bookings', { id: bookingId });
    if (!verified) {
      console.error(`CRITICAL: Booking ${bookingId} not found after restore insert — aborting`);
      return res.status(500).json({ detail: 'Restore verification failed — booking stays in deleted' });
    }

    // Step 3: Remove from deleted_bookings
    await deleteOne('deleted_bookings', { id: bookingId });

    console.log(`Booking ${bookingId} restored from deleted_bookings to bookings`);
    return res.status(200).json({ success: true, booking: verified });
  } catch (err) {
    console.error('Restore booking error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
