/**
 * GET    /api/bookings/:bookingId — Get single booking
 * PATCH  /api/bookings/:bookingId — Update booking fields
 * DELETE /api/bookings/:bookingId — Soft-delete (moves to deleted_bookings)
 */
const { findOne, updateOne, insertOne, deleteOne } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).json({ detail: 'bookingId is required' });
  }

  if (req.method === 'GET') {
    try {
      const booking = await findOne('bookings', { id: bookingId });
      if (!booking) {
        return res.status(404).json({ detail: 'Booking not found' });
      }
      return res.status(200).json(booking);
    } catch (err) {
      console.error('Get booking error:', err.message);
      return res.status(500).json({ detail: err.message });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const updates = req.body;
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ detail: 'No update fields provided' });
      }

      updates.updatedAt = new Date().toISOString();

      await updateOne('bookings', { id: bookingId }, { $set: updates });
      const updated = await findOne('bookings', { id: bookingId });
      if (!updated) {
        return res.status(404).json({ detail: 'Booking not found' });
      }
      return res.status(200).json(updated);
    } catch (err) {
      console.error('Update booking error:', err.message);
      return res.status(500).json({ detail: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // ZERO BOOKING LOSS: verify backup before deleting
      const booking = await findOne('bookings', { id: bookingId });
      if (!booking) {
        return res.status(404).json({ detail: 'Booking not found' });
      }

      // Step 1: Insert into deleted_bookings
      booking.deleted_at = new Date().toISOString();
      const backupResult = await insertOne('deleted_bookings', booking);
      if (!backupResult.acknowledged) {
        console.error(`CRITICAL: Failed to backup booking ${bookingId} before delete`);
        return res.status(500).json({ detail: 'Failed to backup booking — delete aborted' });
      }

      // Step 2: Verify the backup exists
      const verified = await findOne('deleted_bookings', { id: bookingId });
      if (!verified) {
        console.error(`CRITICAL: Booking ${bookingId} backup not found after insert — delete aborted`);
        return res.status(500).json({ detail: 'Backup verification failed — delete aborted' });
      }

      // Step 3: Only now delete from active bookings
      await deleteOne('bookings', { id: bookingId });

      console.log(`Booking ${bookingId} soft-deleted (backed up to deleted_bookings)`);
      return res.status(200).json({ success: true, message: 'Booking deleted (recoverable)' });
    } catch (err) {
      console.error('Delete booking error:', err.message);
      return res.status(500).json({ detail: err.message });
    }
  }

  return res.status(405).json({ detail: 'Method not allowed' });
};
