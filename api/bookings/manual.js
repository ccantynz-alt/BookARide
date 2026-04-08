/**
 * POST /api/bookings/manual — Admin-created booking
 *
 * Used by the admin Create Booking modal (CreateBookingModal.jsx) when
 * staff manually enter a booking on a customer's behalf.
 *
 * Differs from POST /api/bookings in three ways:
 *   1. Requires admin JWT auth (prevents abuse of priceOverride).
 *   2. Accepts `priceOverride` to manually set the total price.
 *   3. Handles non-Stripe payment methods (cash, bank-transfer, card,
 *      pay-on-pickup) by marking the booking as paid/confirmed and
 *      firing the customer confirmation + admin notification emails
 *      immediately — no Stripe redirect required.
 *
 * For Stripe/PayPal payment methods, this endpoint creates a Stripe
 * checkout session server-side and emails the customer the payment
 * link so they can pay later without being redirected by the admin.
 */
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findOne, insertOne, updateOne, getDb } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const {
  customerBookingReceivedEmail,
  customerBookingConfirmedEmail,
  customerPaymentLinkEmail,
  adminNewBookingEmail,
} = require('../_lib/email-templates');

const PAID_METHODS = new Set([
  'cash',
  'pay-on-pickup',
  'card',
  'bank-transfer',
  'already-paid',
]);
const STRIPE_METHODS = new Set(['stripe', 'paypal']);

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, detail: 'Admin authentication required' };
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    return { ok: false, status: 500, detail: 'JWT_SECRET_KEY not configured on server' };
  }
  try {
    const payload = jwt.verify(token, secret);
    const admin = await findOne('admin_users', { username: payload.sub });
    if (!admin) return { ok: false, status: 401, detail: 'Admin user not found' };
    if (admin.is_active === false) return { ok: false, status: 401, detail: 'Admin account disabled' };
    return { ok: true, admin };
  } catch {
    return { ok: false, status: 401, detail: 'Invalid or expired admin token' };
  }
}

async function getNextReferenceNumber() {
  const sql = getDb();
  const result = await sql`
    INSERT INTO counters (data)
    VALUES ('{"name": "booking_reference", "value": 1}'::jsonb)
    ON CONFLICT ((data->>'name'))
    DO UPDATE SET data = jsonb_set(counters.data, '{value}', to_jsonb((counters.data->>'value')::int + 1))
    RETURNING (data->>'value')::int as value
  `.catch(() => null);
  if (result && result.length > 0) return result[0].value;
  const countResult = await sql`SELECT COUNT(*) as cnt FROM bookings`;
  return (countResult[0]?.cnt || 0) + 1;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  // === Admin auth ===
  const auth = await verifyAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ detail: auth.detail });

  try {
    const body = req.body || {};

    // === Validation ===
    const missing = [];
    if (!body.name?.trim()) missing.push('name');
    if (!body.email?.trim()) missing.push('email');
    if (!body.phone?.trim()) missing.push('phone');
    if (!body.pickupAddress?.trim()) missing.push('pickupAddress');
    if (!body.dropoffAddress?.trim()) missing.push('dropoffAddress');
    if (!body.date?.trim()) missing.push('date');
    if (!body.time?.trim()) missing.push('time');
    if (missing.length > 0) {
      return res.status(400).json({
        detail: `Missing required fields: ${missing.join(', ')}`,
        missing,
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({ detail: 'Invalid email address format' });
    }

    const paymentMethod = (body.paymentMethod || 'stripe').toLowerCase();

    // === Pricing ===
    const pricingFromBody = body.pricing || {};
    const calculatedTotal = parseFloat(pricingFromBody.totalPrice || 0);
    const override = body.priceOverride != null && body.priceOverride !== ''
      ? parseFloat(body.priceOverride)
      : null;
    const finalTotal = override != null && override > 0 ? override : calculatedTotal;

    if (!finalTotal || finalTotal <= 0) {
      return res.status(400).json({
        detail: 'A valid total price is required (calculated or price override)',
      });
    }

    // === Build booking doc ===
    const id = uuidv4();
    const refNumber = await getNextReferenceNumber();

    // Normalize flight numbers across the various admin field names
    const outboundFlight = (
      body.flightNumber ||
      body.flightArrivalNumber ||
      body.flightDepartureNumber ||
      ''
    ).trim();
    const returnFlight = (
      body.returnDepartureFlightNumber ||
      body.returnFlightNumber ||
      ''
    ).trim();

    // Payment method determines initial status
    const isPaidMethod = PAID_METHODS.has(paymentMethod);
    const isStripeMethod = STRIPE_METHODS.has(paymentMethod);

    const bookingDoc = {
      ...body,
      id,
      referenceNumber: String(refNumber),
      flightNumber: outboundFlight,
      departureFlightNumber: outboundFlight,
      arrivalFlightNumber: outboundFlight,
      flightArrivalNumber: outboundFlight,
      flightDepartureNumber: outboundFlight,
      returnDepartureFlightNumber: returnFlight,
      returnFlightNumber: returnFlight,
      serviceType: body.serviceType || 'airport-transfer',
      pricing: { ...pricingFromBody, totalPrice: finalTotal },
      totalPrice: finalTotal,
      priceOverride: override,
      payment_method: paymentMethod,
      payment_status: isPaidMethod ? 'paid' : 'unpaid',
      status: isPaidMethod ? 'confirmed' : 'pending',
      createdBy: 'admin',
      createdByUsername: auth.admin.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // === Insert + verify (zero booking loss) ===
    const inserted = await insertOne('bookings', bookingDoc).catch(err => {
      console.error(`CRITICAL: Manual booking insert threw for #${refNumber}: ${err.message}`);
      return null;
    });
    if (!inserted || !inserted.acknowledged) {
      return res.status(500).json({ detail: 'Failed to save booking. Please try again.' });
    }
    const saved = await findOne('bookings', { id });
    if (!saved) {
      console.error(`CRITICAL: Manual booking #${refNumber} not found after insert`);
      return res.status(500).json({ detail: 'Booking verification failed' });
    }
    console.log(`Admin manual booking #${refNumber} created by ${auth.admin.username}`);

    // === Email diagnostics (so Vercel logs show exactly what's happening) ===
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    if (!process.env.MAILGUN_API_KEY) {
      console.error(`CRITICAL: MAILGUN_API_KEY not set — manual booking #${refNumber} created but NO emails will send`);
    }
    if (!process.env.BOOKINGS_NOTIFICATION_EMAIL) {
      console.warn(`WARN: BOOKINGS_NOTIFICATION_EMAIL not set — admin notification going to default ${adminEmail}`);
    }

    // === Send admin notification (always) ===
    try {
      const adminTemplate = adminNewBookingEmail(bookingDoc, { requiresApproval: false });
      const cc = body.ccEmail && emailRegex.test(body.ccEmail) ? body.ccEmail : undefined;
      const adminSuccess = await sendEmail({
        to: adminEmail,
        subject: `[Admin-Created] ${adminTemplate.subject}`,
        html: adminTemplate.html,
        cc,
      });
      if (adminSuccess) {
        console.log(`Admin notification sent to ${adminEmail} for manual booking #${refNumber}`);
      } else {
        console.error(`CRITICAL: Admin notification returned false for manual booking #${refNumber} (recipient: ${adminEmail})`);
      }
    } catch (err) {
      console.error(`Admin notification threw for manual booking #${refNumber}: ${err.message}`);
    }

    // === Handle payment method ===
    const result = {
      ...bookingDoc,
      admin_email_recipient: adminEmail,
      mailgun_configured: !!process.env.MAILGUN_API_KEY,
    };

    if (isStripeMethod) {
      // Create a Stripe checkout session and email the link
      try {
        if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_API_KEY) {
          console.error(`CRITICAL: Stripe key not set — cannot create payment link for manual booking #${refNumber}`);
          result.payment_link_error = 'Stripe not configured on server';
        } else {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY);
          const frontendOrigin = process.env.FRONTEND_URL || 'https://bookaride.co.nz';
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            currency: 'nzd',
            line_items: [{
              price_data: {
                currency: 'nzd',
                unit_amount: Math.round(finalTotal * 100),
                product_data: {
                  name: `BookaRide Transfer - Ref #${refNumber}`,
                  description: `${body.pickupAddress} to ${body.dropoffAddress}`,
                },
              },
              quantity: 1,
            }],
            customer_email: body.email,
            success_url: `${frontendOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendOrigin}/book-now`,
            metadata: {
              booking_id: id,
              booking_type: 'admin_manual',
              customer_email: body.email,
              customer_name: body.name,
            },
          });

          // Record the transaction (non-blocking)
          insertOne('payment_transactions', {
            id: uuidv4(),
            booking_id: id,
            session_id: session.id,
            amount: finalTotal,
            currency: 'nzd',
            payment_status: 'pending',
            status: 'initiated',
            customer_email: body.email,
            customer_name: body.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).catch(err => {
            console.error(`Non-critical: payment_transactions insert failed: ${err.message}`);
          });

          await updateOne('bookings', { id }, {
            $set: {
              payment_session_id: session.id,
              payment_status: 'pending',
              payment_link_sent_at: new Date().toISOString(),
              payment_link_sent_count: 1,
              payment_link_method: 'stripe',
            },
          }).catch(err => console.error(`Non-critical: booking update for payment link failed: ${err.message}`));

          // Email the payment link to the customer
          const linkTemplate = customerPaymentLinkEmail(bookingDoc, session.url);
          const cc = body.ccEmail && emailRegex.test(body.ccEmail) ? body.ccEmail : undefined;
          const linkSuccess = await sendEmail({
            to: body.email,
            subject: linkTemplate.subject,
            html: linkTemplate.html,
            replyTo: 'info@bookaride.co.nz',
            cc,
          });
          if (linkSuccess) {
            console.log(`Payment link emailed to ${body.email} for manual booking #${refNumber}`);
            result.payment_link_sent_to = body.email;
          } else {
            console.error(`CRITICAL: Payment link email failed for manual booking #${refNumber}`);
            result.payment_link_error = 'Mailgun returned failure sending payment link';
          }
          result.payment_link_url = session.url;
          result.payment_session_id = session.id;
        }
      } catch (stripeErr) {
        console.error(`CRITICAL: Stripe checkout creation failed for manual booking #${refNumber}: ${stripeErr.message}`);
        result.payment_link_error = `Stripe error: ${stripeErr.message}`;
      }

      // Also send the initial "booking received" email so the customer has a
      // record even if the payment link lands in spam.
      try {
        const receivedTemplate = customerBookingReceivedEmail(bookingDoc);
        const cc = body.ccEmail && emailRegex.test(body.ccEmail) ? body.ccEmail : undefined;
        await sendEmail({
          to: body.email,
          subject: receivedTemplate.subject,
          html: receivedTemplate.html,
          replyTo: 'info@bookaride.co.nz',
          cc,
        });
      } catch (err) {
        console.error(`Customer received email failed for manual booking #${refNumber}: ${err.message}`);
      }
    } else if (isPaidMethod) {
      // Paid on the spot — send the "confirmed + paid" email straight away.
      try {
        const confirmedTemplate = customerBookingConfirmedEmail(bookingDoc);
        const cc = body.ccEmail && emailRegex.test(body.ccEmail) ? body.ccEmail : undefined;
        const success = await sendEmail({
          to: body.email,
          subject: confirmedTemplate.subject,
          html: confirmedTemplate.html,
          replyTo: 'info@bookaride.co.nz',
          cc,
        });
        if (success) {
          console.log(`Customer confirmation sent to ${body.email} for manual booking #${refNumber} (${paymentMethod})`);
          result.customer_email_sent_to = body.email;
        } else {
          console.error(`CRITICAL: Customer confirmation returned false for manual booking #${refNumber}`);
          result.customer_email_error = 'Mailgun returned failure';
        }
      } catch (err) {
        console.error(`Customer confirmation threw for manual booking #${refNumber}: ${err.message}`);
        result.customer_email_error = err.message;
      }
    } else {
      // Unknown payment method — still send "booking received"
      try {
        const receivedTemplate = customerBookingReceivedEmail(bookingDoc);
        const cc = body.ccEmail && emailRegex.test(body.ccEmail) ? body.ccEmail : undefined;
        await sendEmail({
          to: body.email,
          subject: receivedTemplate.subject,
          html: receivedTemplate.html,
          replyTo: 'info@bookaride.co.nz',
          cc,
        });
      } catch (err) {
        console.error(`Customer received email failed for manual booking #${refNumber}: ${err.message}`);
      }
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('CRITICAL: Unhandled error in manual booking handler:', err);
    return res.status(500).json({
      detail: `Error creating manual booking: ${err.message}`,
    });
  }
};
