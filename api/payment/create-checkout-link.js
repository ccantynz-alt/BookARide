/**
 * POST /api/payment/create-checkout-link
 * Create a reusable Stripe payment link for a booking (admin sends to customer).
 */
const { findOne, updateOne } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeKey) {
      return res.status(500).json({ detail: 'Stripe not configured' });
    }
    const stripe = require('stripe')(stripeKey);

    const { booking_id, origin_url } = req.body;
    if (!booking_id) {
      return res.status(400).json({ detail: 'booking_id is required' });
    }

    const booking = await findOne('bookings', { id: booking_id });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    const amount = parseFloat(booking.totalPrice || 0);
    if (amount <= 0) {
      return res.status(400).json({ detail: 'Invalid booking amount' });
    }

    const frontendOrigin = origin_url || process.env.FRONTEND_URL || 'https://bookaride.co.nz';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'nzd',
      line_items: [{
        price_data: {
          currency: 'nzd',
          unit_amount: Math.round(amount * 100),
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

    await updateOne('bookings', { id: booking_id }, {
      $set: { payment_session_id: session.id, payment_link_url: session.url },
    });

    return res.status(200).json({
      session_id: session.id,
      checkout_url: session.url,
      payment_link: session.url,
    });
  } catch (err) {
    console.error('Create checkout link error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
