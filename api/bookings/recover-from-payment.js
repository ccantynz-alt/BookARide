/**
 * POST /api/bookings/recover-from-payment
 * Recover a booking from an orphaned Stripe payment.
 */
const { findOne, insertOne } = require('../_lib/db');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ detail: 'session_id is required' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeKey) {
      return res.status(500).json({ detail: 'Stripe not configured' });
    }
    const stripe = require('stripe')(stripeKey);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const bookingId = session.metadata?.booking_id || uuidv4();

    // Check if booking already exists
    const existing = await findOne('bookings', { id: bookingId });
    if (existing) {
      return res.status(409).json({ detail: 'Booking already exists', booking: existing });
    }

    // Create recovered booking
    const booking = {
      id: bookingId,
      referenceNumber: `REC-${Date.now()}`,
      email: session.customer_email || session.metadata?.customer_email || '',
      firstName: (session.metadata?.customer_name || '').split(' ')[0] || 'Recovered',
      lastName: (session.metadata?.customer_name || '').split(' ').slice(1).join(' ') || 'Booking',
      totalPrice: session.amount_total ? session.amount_total / 100 : 0,
      payment_status: 'paid',
      payment_method: 'stripe',
      status: 'confirmed',
      serviceType: 'airport-transfer',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      recovered_from_payment: true,
      recovered_at: new Date().toISOString(),
      createdAt: new Date(session.created * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      pickupAddress: session.metadata?.pickup_address || 'See Stripe payment details',
      dropoffAddress: session.metadata?.dropoff_address || 'See Stripe payment details',
    };

    const result = await insertOne('bookings', booking);
    if (!result.acknowledged) {
      console.error(`CRITICAL: Failed to insert recovered booking from session ${session_id}`);
      return res.status(500).json({ detail: 'Failed to save recovered booking' });
    }

    // Verify
    const verified = await findOne('bookings', { id: bookingId });
    if (!verified) {
      console.error(`CRITICAL: Recovered booking ${bookingId} not found after insert`);
      return res.status(500).json({ detail: 'Recovered booking verification failed' });
    }

    console.log(`Booking recovered from Stripe session ${session_id}: ${bookingId}`);
    return res.status(201).json(verified);
  } catch (err) {
    console.error('Recover from payment error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
