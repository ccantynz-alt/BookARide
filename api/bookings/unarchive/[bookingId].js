/**
 * POST /api/bookings/unarchive/:bookingId
 *
 * Unarchive a booking — moves it from `bookings_archive` back to `bookings`.
 * ZERO BOOKING LOSS: insert into bookings first, verify, only THEN delete
 * from archive.
 */
const { findOne, insertOne, deleteOne } = require('../../_lib/db');
const { verifyAdmin } = require('../../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ detail: 'bookingId is required' });

  try {
    const booking = await findOne('bookings_archive', { id: bookingId });
    if (!booking) return res.status(404).json({ detail: 'Archived booking not found' });

    delete booking.archivedAt;
    booking.unarchivedAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    const result = await insertOne('bookings', booking);
    if (!result.acknowledged) {
      console.error(`CRITICAL: unarchive failed for ${bookingId} — insert not acknowledged`);
      return res.status(500).json({ detail: 'Unarchive failed — booking stays archived' });
    }

    const verified = await findOne('bookings', { id: bookingId });
    if (!verified) {
      console.error(`CRITICAL: unarchive verification failed for ${bookingId}`);
      return res.status(500).json({ detail: 'Unarchive verification failed — booking stays archived' });
    }

    await deleteOne('bookings_archive', { id: bookingId });
    console.error(`Booking ${bookingId} (#${booking.referenceNumber}) unarchived`);
    return res.status(200).json({
      success: true,
      bookingId,
      referenceNumber: booking.referenceNumber || bookingId,
    });
  } catch (err) {
    console.error('Unarchive booking error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
