/**
 * PUT /api/bookings/:bookingId/payment-status
 *
 * Admin updates the payment_status of a booking. Used by the
 * BookingDetailsModal "Change -> Update" control in the admin
 * dashboard.
 *
 * Body: { paymentStatus: 'paid' | 'cash' | 'pay-on-pickup' | 'invoiced' | 'unpaid' }
 */
const { findOne, updateOne } = require('../../_lib/db');
const { verifyAdmin } = require('../../_lib/auth');

const ALLOWED = new Set(['paid', 'cash', 'pay-on-pickup', 'invoiced', 'unpaid', 'pending', 'refunded']);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'PUT' && req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ detail: 'bookingId is required' });

  const newStatus = (req.body?.paymentStatus || req.body?.payment_status || '').toLowerCase().trim();
  if (!newStatus) {
    return res.status(400).json({ detail: 'paymentStatus is required in request body' });
  }
  if (!ALLOWED.has(newStatus)) {
    return res.status(400).json({
      detail: `Invalid paymentStatus '${newStatus}'. Allowed: ${[...ALLOWED].join(', ')}`,
    });
  }

  try {
    const existing = await findOne('bookings', { id: bookingId });
    if (!existing) return res.status(404).json({ detail: 'Booking not found' });

    const update = {
      payment_status: newStatus,
      payment_status_updated_at: new Date().toISOString(),
    };

    // If admin marks as paid and the booking is still pending, also confirm
    // the booking. This matches what the Stripe webhook does on a real
    // payment so manual + automatic paths produce the same final state.
    if (newStatus === 'paid' && existing.status !== 'completed' && existing.status !== 'cancelled') {
      update.status = 'confirmed';
      update.payment_confirmed_at = update.payment_confirmed_at || new Date().toISOString();
    }

    const result = await updateOne('bookings', { id: bookingId }, { $set: update });
    if (!result || result.matched_count === 0) {
      console.error(`CRITICAL: payment_status update for ${bookingId} matched zero rows`);
      return res.status(500).json({ detail: 'Update did not match any booking' });
    }

    console.error(`Booking ${bookingId} payment_status -> ${newStatus} by admin`);
    return res.status(200).json({
      success: true,
      bookingId,
      payment_status: newStatus,
      status: update.status || existing.status,
    });
  } catch (err) {
    console.error(`CRITICAL: payment_status update threw for ${bookingId}: ${err.message}`);
    return res.status(500).json({ detail: `Failed to update payment status: ${err.message}` });
  }
};
