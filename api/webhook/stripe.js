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
const { findOne, updateOne, insertOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { sendSms } = require('../_lib/twilio');
const {
  customerBookingConfirmedEmail,
  emailWrapper,
  bookingDetailsTable,
  customerName: getCustomerName,
} = require('../_lib/email-templates');
const { bookingConfirmedSms } = require('../_lib/sms-templates');

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

      // Refetch the booking so it has the latest payment_status='paid' for email templates
      const paidBooking = { ...booking, payment_status: 'paid', status: 'confirmed' };
      const name = getCustomerName(paidBooking);

      // 1. Customer confirmation email
      const customerTemplate = customerBookingConfirmedEmail(paidBooking);
      await sendEmail({
        to: booking.email,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        replyTo: 'info@bookaride.co.nz',
      }).catch(err => console.error('Customer confirmation email failed:', err.message));

      // 2. Admin notification
      const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
      const adminBody = `
        <h2 style="color:#059669;">Payment Received</h2>
        <p><strong>Customer:</strong> ${name} (${booking.email})</p>
        ${bookingDetailsTable(paidBooking)}
        <p style="margin-top:20px;"><a href="https://bookaride.co.nz/admin/login" style="background:#1a1a1a; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">View in Admin Dashboard</a></p>
      `;
      await sendEmail({
        to: adminEmail,
        subject: `PAID: Booking #${booking.referenceNumber} - ${name}`,
        html: emailWrapper(adminBody),
      }).catch(err => console.error('Admin notification email failed:', err.message));

      // 3. Customer confirmation SMS (Twilio)
      if (booking.phone) {
        const smsBody = bookingConfirmedSms(paidBooking);
        const smsOk = await sendSms({ to: booking.phone, body: smsBody });
        if (smsOk) {
          console.log(`Payment confirmation SMS sent for booking #${booking.referenceNumber} to ${booking.phone}`);
        } else {
          console.error(`SMS confirmation failed for booking #${booking.referenceNumber} (phone: ${booking.phone})`);
        }
      } else {
        console.warn(`No phone number on booking #${booking.referenceNumber} — skipping SMS confirmation`);
      }

      // 4. Google Calendar event — TODO: port calendar integration
      // 5. iCloud contact sync — TODO: port iCloud integration
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return res.status(400).json({ detail: `Webhook error: ${err.message}` });
  }
};
