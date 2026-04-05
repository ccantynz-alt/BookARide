/**
 * GET /api/payment/status/:sessionId
 * Check Stripe checkout session payment status.
 * Used by PaymentSuccess.jsx to poll until payment confirms.
 */
const { findOne, updateOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');
const { createCalendarEvent } = require('../../_lib/google-calendar');

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

      // Send admin notification (webhook may not have arrived yet)
      const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Customer';
      const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
      await sendEmail({
        to: adminEmail,
        subject: `PAID: Booking #${booking.referenceNumber} - ${customerName}`,
        html: `<h2>Payment Received</h2>
          <p><strong>Ref:</strong> #${booking.referenceNumber}</p>
          <p><strong>Customer:</strong> ${customerName} (${booking.email})</p>
          <p><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
          <p><strong>Amount:</strong> $${booking.totalPrice} NZD</p>
          <p><strong>Route:</strong> ${booking.pickupAddress} → ${booking.dropoffAddress}</p>
          <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
          <p><strong>Passengers:</strong> ${booking.passengers || 1}</p>
          <p style="color:#16a34a;font-weight:bold;">Payment confirmed via Stripe</p>`,
      }).catch(err => console.error('Admin payment notification failed:', err.message));

      // Send customer confirmation
      await sendEmail({
        to: booking.email,
        subject: `Booking Confirmed - Ref #${booking.referenceNumber}`,
        html: `<h2>Payment Successful!</h2>
          <p>Hi ${customerName},</p>
          <p>Your booking has been confirmed and payment received.</p>
          <p><strong>Reference:</strong> #${booking.referenceNumber}</p>
          <p><strong>Pickup:</strong> ${booking.pickupAddress}</p>
          <p><strong>Dropoff:</strong> ${booking.dropoffAddress}</p>
          <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
          <p><strong>Amount Paid:</strong> $${booking.totalPrice} NZD</p>
          <p><strong>Payment Method:</strong> Credit/Debit Card</p>
          <p>Thank you for choosing BookaRide!</p>`,
      }).catch(err => console.error('Customer confirmation failed:', err.message));

      // Create Google Calendar event
      await createCalendarEvent(booking)
        .catch(err => console.error('Calendar event creation failed:', err.message));
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
