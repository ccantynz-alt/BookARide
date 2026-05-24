/**
 * GET /api/bookings/orphan-payments
 * Find Stripe payments that don't have a matching booking in the database.
 */
const { findOne } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeKey) {
      return res.status(500).json({ detail: 'Stripe not configured' });
    }
    const stripe = require('stripe')(stripeKey);

    // Get recent completed checkout sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
      status: 'complete',
    });

    const orphans = [];
    for (const session of sessions.data) {
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) continue;

      const booking = await findOne('bookings', { id: bookingId });
      if (!booking) {
        orphans.push({
          session_id: session.id,
          booking_id: bookingId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          customer_email: session.customer_email || session.metadata?.customer_email || '',
          customer_name: session.metadata?.customer_name || '',
          created: new Date(session.created * 1000).toISOString(),
        });
      }
    }

    return res.status(200).json({ orphans, count: orphans.length });
  } catch (err) {
    console.error('Orphan payments error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
