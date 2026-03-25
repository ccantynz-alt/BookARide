/**
 * GET /api/payment/status/:sessionId
 * Check Stripe checkout session payment status.
 * Used by PaymentSuccess.jsx to poll until payment confirms.
 */
const { findOne, updateOne } = require('../../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ detail: 'sessionId is required' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY);

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session.metadata?.booking_id;

    // Get booking from database
    let booking = null;
    if (bookingId) {
      booking = await findOne('bookings', { id: bookingId });
    }

    // If Stripe says paid but our DB hasn't caught up (webhook delay), update now
    if (session.payment_status === 'paid' && booking && booking.payment_status !== 'paid') {
      await updateOne('bookings', { id: bookingId }, {
        $set: {
          payment_status: 'paid',
          status: 'confirmed',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          payment_confirmed_at: new Date().toISOString(),
        },
      });
      // Refresh booking
      booking = await findOne('bookings', { id: bookingId });
    }

    return res.status(200).json({
      payment_status: session.payment_status,
      booking_status: booking?.status || 'unknown',
      booking_id: bookingId,
      referenceNumber: booking?.referenceNumber || null,
      amount_total: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency,
      customer_email: session.customer_email || booking?.email || null,
      booking: booking || null,
    });
  } catch (err) {
    console.error('Payment status check error:', err.message);
    return res.status(500).json({ detail: `Error checking payment status: ${err.message}` });
  }
};
