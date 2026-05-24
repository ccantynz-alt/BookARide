/**
 * POST /api/bookings/sync-pending-payments
 * Sync pending Stripe payments — checks Stripe for completed payments
 * that our webhook might have missed.
 */
const { findMany, findOne, updateOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { customerBookingConfirmedEmail } = require('../_lib/email-templates');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeKey) {
      return res.status(500).json({ detail: 'Stripe not configured' });
    }
    const stripe = require('stripe')(stripeKey);

    // Find bookings with pending payment that have a Stripe session
    const pendingBookings = await findMany('bookings', { payment_status: 'pending' }, { limit: 50 });
    const withSession = pendingBookings.filter(b => b.payment_session_id);

    let synced = 0;
    const errors = [];

    for (const booking of withSession) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.payment_session_id);
        if (session.payment_status === 'paid') {
          await updateOne('bookings', { id: booking.id }, {
            $set: {
              payment_status: 'paid',
              status: 'confirmed',
              stripe_payment_intent: session.payment_intent,
              payment_confirmed_at: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
          synced++;
          console.error(`Synced payment for booking ${booking.id} (ref #${booking.referenceNumber})`);

          // Send customer confirmation — without this, a customer whose booking
          // is synced here would be marked paid in the DB but never notified.
          if (booking.email) {
            const updatedBooking = await findOne('bookings', { id: booking.id }).catch(() => null);
            const paidBooking = updatedBooking || { ...booking, payment_status: 'paid', status: 'confirmed' };
            const template = customerBookingConfirmedEmail(paidBooking);
            await sendEmail({
              to: booking.email,
              subject: template.subject,
              html: template.html,
              replyTo: 'info@bookaride.co.nz',
            }).catch(err => console.error(`Confirmation email failed for synced booking ${booking.id}: ${err.message}`));
          }
        }
      } catch (err) {
        errors.push({ bookingId: booking.id, error: err.message });
      }
    }

    return res.status(200).json({
      checked: withSession.length,
      synced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Sync pending payments error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
