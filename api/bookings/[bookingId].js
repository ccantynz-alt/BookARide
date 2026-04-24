/**
 * GET    /api/bookings/:bookingId — Get single booking
 * PATCH  /api/bookings/:bookingId — Update booking fields
 * DELETE /api/bookings/:bookingId — Soft-delete (moves to deleted_bookings)
 *
 * DELETE query params:
 *   send_notification=true  — send cancellation email to customer before deleting
 *   force=true              — allow cancellation of paid Stripe bookings
 */
const { findOne, updateOne, insertOne, deleteOne } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyAdmin(req, res)) return;

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
      const sendNotification = req.query.send_notification === 'true';
      const force = req.query.force === 'true';

      const booking = await findOne('bookings', { id: bookingId });
      if (!booking) {
        return res.status(404).json({ detail: 'Booking not found' });
      }

      // Safety check: warn before cancelling paid Stripe bookings
      if (!force && booking.payment_status === 'paid' && booking.stripe_payment_intent) {
        return res.status(400).json({
          detail: `This booking has a paid Stripe payment (${booking.stripe_payment_intent}). Use force=true to cancel anyway. You may need to process a refund separately in Stripe.`,
        });
      }

      // Send cancellation email BEFORE deleting so the booking details are still accessible
      if (sendNotification && booking.email) {
        try {
          const template = customerCancellationEmail(booking);
          const sent = await sendEmail({
            to: booking.email,
            subject: template.subject,
            html: template.html,
            replyTo: 'info@bookaride.co.nz',
          });
          if (sent) {
            console.error(`Cancellation email sent to ${booking.email} for booking #${booking.referenceNumber}`);
          } else {
            console.error(`CRITICAL: Cancellation email failed for booking #${booking.referenceNumber} to ${booking.email}`);
          }
        } catch (emailErr) {
          console.error(`CRITICAL: Cancellation email threw for booking #${booking.referenceNumber}: ${emailErr.message}`);
        }
      }

      // ZERO BOOKING LOSS: verify backup before deleting
      booking.deleted_at = new Date().toISOString();
      booking.cancellation_notified = sendNotification;

      // Step 1: Insert into deleted_bookings
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

;      console.error(`Booking ${bookingId} soft-deleted (backed up to deleted_bookings)`);
      return res.status(200).json({ success: true, message: 'Booking deleted (recoverable)' });
    } catch (err) {
      console.error('Delete booking error:', err.message);
      return res.status(500).json({ detail: err.message });
    }
  }

  return res.status(405).json({ detail: 'Method not allowed' });
};
