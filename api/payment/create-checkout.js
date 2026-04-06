/**
 * POST /api/payment/create-checkout
 * Create a Stripe Checkout session for a booking.
 * Replaces: Python backend POST /api/payment/create-checkout
 */
const { findOne, updateOne, insertOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
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

    const amount = parseFloat(booking.totalPrice || 0);
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
        customer_name: `${booking.firstName || ''} ${booking.lastName || ''}`.trim(),
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
      const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Customer';
      sendEmail({
        to: booking.email,
        subject: `Complete Your Payment - Ref #${booking.referenceNumber} - BookARide`,
        html: `
          <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:20px;">
            <h2 style="color:#1a1a1a;">Complete Your Payment</h2>
            <p>Hi ${customerName},</p>
            <p>Click the button below to complete payment for your booking.</p>
            <table style="width:100%; border-collapse:collapse; margin:20px 0;">
              <tr><td style="padding:8px; background:#f8f8f8;"><strong>Reference:</strong></td><td style="padding:8px;">#${booking.referenceNumber}</td></tr>
              <tr><td style="padding:8px; background:#f8f8f8;"><strong>Pickup:</strong></td><td style="padding:8px;">${booking.pickupAddress}</td></tr>
              <tr><td style="padding:8px; background:#f8f8f8;"><strong>Dropoff:</strong></td><td style="padding:8px;">${booking.dropoffAddress}</td></tr>
              <tr><td style="padding:8px; background:#f8f8f8;"><strong>Date:</strong></td><td style="padding:8px;">${booking.date} at ${booking.time}</td></tr>
              <tr><td style="padding:8px; background:#f8f8f8;"><strong>Amount:</strong></td><td style="padding:8px;"><strong>$${amount.toFixed(2)} NZD</strong></td></tr>
            </table>
            <p style="text-align:center; margin:30px 0;">
              <a href="${session.url}" style="background:#1a1a1a; color:#fff; padding:15px 40px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">Pay Now Securely</a>
            </p>
            <p style="font-size:12px; color:#666;">Or copy this link: <a href="${session.url}">${session.url}</a></p>
            <p style="font-size:12px; color:#666; margin-top:30px;">Secure payment via Stripe. Your card details are never stored on our servers.</p>
          </div>`,
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
