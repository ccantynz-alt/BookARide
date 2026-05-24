/**
 * POST /api/bookings/archive/:bookingId
 *
 * Archive a booking — moves it from `bookings` to `bookings_archive`.
 * ZERO BOOKING LOSS: insert into archive first, verify with findOne,
 * only THEN delete from active bookings (matches the restore pattern).
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
    const booking = await findOne('bookings', { id: bookingId });
    if (!booking) return res.status(404).json({ detail: 'Booking not found' });

    booking.archivedAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    const result = await insertOne('bookings_archive', booking);
    if (!result.acknowledged) {
      console.error(`CRITICAL: archive failed for ${bookingId} — insert not acknowledged`);
      return res.status(500).json({ detail: 'Archive failed — booking stays active' });
    }

    const verified = await findOne('bookings_archive', { id: bookingId });
    if (!verified) {
      console.error(`CRITICAL: archive verification failed for ${bookingId}`);
      return res.status(500).json({ detail: 'Archive verification failed — booking stays active' });
    }

    await deleteOne('bookings', { id: bookingId });
    console.error(`Booking ${bookingId} (#${booking.referenceNumber}) archived`);
    return res.status(200).json({
      success: true,
      bookingId,
      referenceNumber: booking.referenceNumber || bookingId,
    });
  } catch (err) {
    console.error('Archive booking error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
