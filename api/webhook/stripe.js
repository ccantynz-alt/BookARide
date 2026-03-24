/**
 * POST /api/webhook/stripe
 * Stripe webhook handler — processes payment completions.
 * Replaces: Python backend POST /api/webhook/stripe
 *
 * CRITICAL: Must trigger all 4 post-payment actions:
 * 1. Customer confirmation email
 * 2. Admin notification
 * 3. Google Calendar event (future)
 * 4. iCloud contact sync (future)
 */
const { findOne, updateOne, insertOne } = require('../lib/db');
const { sendEmail } = require('../lib/mailgun');

// Vercel serverless: disable body parsing so we get the raw body for Stripe verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const rawBody = await getRawBody(req);
    let event;

    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody.toString());
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id;

      if (!bookingId) {
        console.warn('Stripe webhook: no booking_id in metadata');
        return res.status(200).json({ received: true });
      }

      // Find the booking
      const booking = await findOne('bookings', { id: bookingId });
      if (!booking) {
        console.error(`CRITICAL: Stripe payment received but booking ${bookingId} not found`);
        return res.status(200).json({ received: true, warning: 'booking_not_found' });
      }

      // Idempotency: check if already processed
      if (booking.payment_status === 'paid') {
        console.log(`Booking ${bookingId} already marked as paid — skipping duplicate webhook`);
        return res.status(200).json({ received: true, status: 'already_processed' });
      }

      // Update booking status to paid
      await updateOne('bookings', { id: bookingId }, {
        $set: {
          payment_status: 'paid',
          status: 'confirmed',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          payment_confirmed_at: new Date().toISOString(),
        },
      });

      // Update payment transaction
      await updateOne('payment_transactions', { session_id: session.id }, {
        $set: {
          payment_status: 'paid',
          status: 'completed',
          updated_at: new Date().toISOString(),
        },
      }).catch(() => {}); // Non-critical

      console.log(`Payment confirmed for booking ${bookingId} (ref #${booking.referenceNumber})`);

      // === POST-PAYMENT ACTIONS (all 4 required) ===

      // 1. Customer confirmation email
      const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer';
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
      }).catch(err => console.error('Customer confirmation email failed:', err.message));

      // 2. Admin notification
      const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
      await sendEmail({
        to: adminEmail,
        subject: `PAID: Booking #${booking.referenceNumber} - ${customerName}`,
        html: `<h2>Payment Received</h2>
          <p><strong>Ref:</strong> #${booking.referenceNumber}</p>
          <p><strong>Customer:</strong> ${customerName} (${booking.email})</p>
          <p><strong>Amount:</strong> $${booking.totalPrice} NZD</p>
          <p><strong>Route:</strong> ${booking.pickupAddress} → ${booking.dropoffAddress}</p>
          <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>`,
      }).catch(err => console.error('Admin notification email failed:', err.message));

      // 3. Google Calendar event — TODO: port calendar integration
      // 4. iCloud contact sync — TODO: port iCloud integration
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return res.status(400).json({ detail: `Webhook error: ${err.message}` });
  }
};
