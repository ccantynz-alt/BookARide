/**
 * POST /api/bookings/:bookingId/resend-payment-link
 * Generate a fresh Stripe checkout URL and email it to the customer.
 * Replaces: Python backend POST /api/bookings/:id/resend-payment-link
 */
const { findOne, updateOne, insertOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');
const { customerPaymentLinkEmail } = require('../../_lib/email-templates');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).json({ detail: 'bookingId is required' });
  }

  try {
    const booking = await findOne('bookings', { id: bookingId });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    if (!booking.email) {
      return res.status(400).json({ detail: 'Booking has no customer email' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ detail: 'Booking is already paid' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeKey) {
      return res.status(500).json({ detail: 'Stripe API key not configured' });
    }

    const stripe = require('stripe')(stripeKey);
    const amount = parseFloat(booking.pricing?.totalPrice || booking.totalPrice || 0);
    if (amount <= 0) {
      return res.status(400).json({ detail: 'Invalid booking amount' });
    }

    const amountCents = Math.round(amount * 100);
    const frontendOrigin = process.env.FRONTEND_URL || 'https://bookaride.co.nz';

    // Create a fresh Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'nzd',
      line_items: [{
        price_data: {
          currency: 'nzd',
          unit_amount: amountCents,
          product_data: {
            name: `BookARide Transfer - Ref #${booking.referenceNumber}`,
            description: `${booking.pickupAddress} to ${booking.dropoffAddress}`,
          },
        },
        quantity: 1,
      }],
      customer_email: booking.email,
      success_url: `${frontendOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendOrigin}/book-now`,
      metadata: {
        booking_id: bookingId,
        booking_type: 'regular',
        customer_email: booking.email,
      },
    });

    // Record the transaction
    await insertOne('payment_transactions', {
      id: uuidv4(),
      booking_id: bookingId,
      session_id: session.id,
      amount,
      currency: 'nzd',
      payment_status: 'pending',
      status: 'resent',
      customer_email: booking.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).catch(err => console.error('Payment transaction record failed:', err.message));

    // Update booking with new session info and tracking
    await updateOne('bookings', { id: bookingId }, {
      $set: {
        payment_session_id: session.id,
        payment_link_sent_at: new Date().toISOString(),
        payment_link_sent_count: (booking.payment_link_sent_count || 0) + 1,
        payment_link_method: 'stripe',
      },
    });

    // Send the payment link email to the customer
    const template = customerPaymentLinkEmail(booking, session.url);
    const emailSuccess = await sendEmail({
      to: booking.email,
      subject: template.subject,
      html: template.html,
      replyTo: 'info@bookaride.co.nz',
    });

    if (!emailSuccess) {
      console.error(`CRITICAL: Payment link email send failed for booking #${booking.referenceNumber}`);
      return res.status(500).json({ detail: 'Failed to send payment link email' });
    }

    console.log(`Payment link resent for booking #${booking.referenceNumber} to ${booking.email}`);
    return res.status(200).json({
      success: true,
      message: `Payment link sent to ${booking.email}`,
      session_id: session.id,
    });
  } catch (err) {
    console.error('Error resending payment link:', err);
    return res.status(500).json({ detail: `Error resending payment link: ${err.message}` });
  }
};
