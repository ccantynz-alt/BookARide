/**
 * POST /api/payment/create-checkout
 * Create a Stripe Checkout session for a booking.
 * Replaces: Python backend POST /api/payment/create-checkout
 */
const { findOne, updateOne, insertOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { customerPaymentLinkEmail } = require('../_lib/email-templates');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY);
    if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_API_KEY) {
      return res.status(500).json({ detail: 'Stripe API key not configured' });
    }

    const { booking_id, origin_url } = req.body;
    if (!booking_id) {
      return res.status(400).json({ detail: 'booking_id is required' });
    }

    // Get booking from database (server-side amount — never trust frontend)
    const booking = await findOne('bookings', { id: booking_id });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    const amount = parseFloat(
      booking.totalPrice || (booking.pricing && booking.pricing.totalPrice) || 0
    );
    if (amount <= 0) {
      return res.status(400).json({ detail: 'Invalid booking amount' });
    }

    const amountCents = Math.round(amount * 100);
    const frontendOrigin = origin_url || process.env.FRONTEND_URL || 'https://bookaride.co.nz';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'nzd',
      line_items: [{
        price_data: {
          currency: 'nzd',
          unit_amount: amountCents,
          product_data: {
            name: `BookaRide Transfer - Ref #${booking.referenceNumber || 'N/A'}`,
            description: `${booking.pickupAddress} to ${booking.dropoffAddress}`,
          },
        },
        quantity: 1,
      }],
      customer_email: booking.email || undefined,
      success_url: `${frontendOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendOrigin}/book-now`,
      metadata: {
        booking_id,
        booking_type: 'regular',
        customer_email: booking.email || '',
        customer_name: booking.name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer',
      },
    });

    // Record payment transaction
    const txnId = uuidv4();
    await insertOne('payment_transactions', {
      id: txnId,
      booking_id,
      session_id: session.id,
      amount,
      currency: 'nzd',
      payment_status: 'pending',
      status: 'initiated',
      customer_email: booking.email || '',
      customer_name: `${booking.firstName || ''} ${booking.lastName || ''}`.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update booking with session info
    await updateOne('bookings', { id: booking_id }, {
      $set: {
        payment_session_id: session.id,
        payment_status: 'pending',
        payment_link_sent_at: new Date().toISOString(),
        payment_link_sent_count: (booking.payment_link_sent_count || 0) + 1,
        payment_link_method: 'stripe',
      },
    });

    console.log(`Stripe checkout created: ${session.id} for booking ${booking_id}`);

    // Fire-and-forget: email the customer their payment link
    // This means even if they lose the browser, they can click the link in email
    if (booking.email) {
      const template = customerPaymentLinkEmail(booking, session.url);
      sendEmail({
        to: booking.email,
        subject: template.subject,
        html: template.html,
        replyTo: 'info@bookaride.co.nz',
      }).catch(err => console.error(`CRITICAL: Payment link email failed for booking ${booking_id}:`, err.message));
    }

    // Return BOTH url and checkout_url for frontend compatibility
    return res.status(200).json({
      session_id: session.id,
      url: session.url,
      checkout_url: session.url,
    });
  } catch (err) {
    console.error('Error creating Stripe checkout:', err);
    return res.status(500).json({ detail: `Error creating checkout session: ${err.message}` });
  }
};
