/**
 * POST /api/bookings — Create a new booking
 * GET  /api/bookings — List bookings (admin, requires auth)
 *
 * Replaces: Python backend POST /api/bookings, GET /api/bookings
 */
const { findOne, findMany, insertOne, updateOne, getDb } = require('./_lib/db');
const { sendEmail } = require('./_lib/mailgun');
const {
  customerBookingReceivedEmail,
  adminNewBookingEmail,
} = require('./_lib/email-templates');
const { v4: uuidv4 } = require('uuid');

async function getNextReferenceNumber() {
  const sql = getDb();
  // Atomic increment using a counter row
  const result = await sql`
    INSERT INTO counters (data)
    VALUES ('{"name": "booking_reference", "value": 1}'::jsonb)
    ON CONFLICT ((data->>'name'))
    DO UPDATE SET data = jsonb_set(counters.data, '{value}', to_jsonb((counters.data->>'value')::int + 1))
    RETURNING (data->>'value')::int as value
  `.catch(() => null);

  if (result && result.length > 0) {
    return result[0].value;
  }

  // Fallback: count existing bookings
  const countResult = await sql`SELECT COUNT(*) as cnt FROM bookings`;
  return (countResult[0]?.cnt || 0) + 1;
}

function isWithin24Hours(dateStr, timeStr) {
  try {
    const bookingDate = new Date(`${dateStr}T${timeStr}:00+12:00`); // NZST
    const now = new Date();
    const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
    return hoursUntil >= 0 && hoursUntil <= 24;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    return createBooking(req, res);
  }

  if (req.method === 'GET') {
    return listBookings(req, res);
  }

  return res.status(405).json({ detail: 'Method not allowed' });
};

async function createBooking(req, res) {
  try {
    const booking = req.body || {};

    // === EXPLICIT VALIDATION — fail fast with clear errors ===
    const missing = [];
    if (!booking.pickupAddress?.trim()) missing.push('pickupAddress');
    if (!booking.dropoffAddress?.trim()) missing.push('dropoffAddress');
    if (!booking.date?.trim()) missing.push('date');
    if (!booking.time?.trim()) missing.push('time');
    if (!booking.email?.trim()) missing.push('email');
    if (!booking.phone?.trim()) missing.push('phone');
    if (!booking.name?.trim() && !booking.firstName?.trim()) missing.push('name');

    if (missing.length > 0) {
      console.warn(`Booking validation failed — missing fields: ${missing.join(', ')}`);
      return res.status(400).json({
        detail: `Missing required fields: ${missing.join(', ')}`,
        missing,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(booking.email)) {
      return res.status(400).json({ detail: 'Invalid email address format' });
    }

    // Generate unique ID and reference number
    const id = uuidv4();
    const refNumber = await getNextReferenceNumber();

    // Normalize flight number fields (frontend may send any of these names)
    const outboundFlight = booking.flightNumber || booking.departureFlightNumber || booking.arrivalFlightNumber || '';
    const returnFlight = booking.returnDepartureFlightNumber || booking.returnFlightNumber || '';

    // Check if within 24 hours (requires admin approval)
    const requiresApproval = isWithin24Hours(booking.date, booking.time);

    // Build the canonical booking document
    const bookingDoc = {
      ...booking,
      id,
      referenceNumber: String(refNumber),
      flightNumber: outboundFlight,
      departureFlightNumber: outboundFlight,
      arrivalFlightNumber: outboundFlight,
      returnDepartureFlightNumber: returnFlight,
      returnFlightNumber: returnFlight,
      status: requiresApproval ? 'pending_approval' : 'pending',
      totalPrice: booking.pricing?.totalPrice || booking.totalPrice || 0,
      payment_status: 'unpaid',
      payment_method: booking.paymentMethod || 'stripe',
      serviceType: booking.serviceType || 'airport-transfer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // === ZERO BOOKING LOSS RULE: insert + verify before responding ===
    let inserted;
    try {
      inserted = await insertOne('bookings', bookingDoc);
    } catch (insertErr) {
      console.error(`CRITICAL: Database insert threw for booking #${refNumber}: ${insertErr.message}`);
      return res.status(500).json({
        detail: 'Failed to save booking. Please try again or contact us at info@bookaride.co.nz',
      });
    }

    if (!inserted || !inserted.acknowledged) {
      console.error(`CRITICAL: Database insert not acknowledged for booking #${refNumber}`);
      return res.status(500).json({ detail: 'Failed to save booking to database' });
    }

    // Verify the booking was actually saved
    const saved = await findOne('bookings', { id });
    if (!saved) {
      console.error(`CRITICAL: Booking #${refNumber} not found after insert — potential data loss!`);
      return res.status(500).json({ detail: 'Booking verification failed' });
    }

    console.log(`Booking #${refNumber} created and verified: ${id}`);

    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';

    // === EMAIL DIAGNOSTICS ===
    if (!process.env.MAILGUN_API_KEY) {
      console.error(`CRITICAL: MAILGUN_API_KEY not set — booking #${refNumber} created but NO emails will be sent`);
    }
    if (!process.env.MAILGUN_DOMAIN) {
      console.warn(`MAILGUN_DOMAIN not set — using default (mg.bookaride.co.nz)`);
    }

    // 1. Send CUSTOMER confirmation email (fire-and-forget — don't block booking response)
    try {
      const customerTemplate = customerBookingReceivedEmail(bookingDoc, { requiresApproval });
      sendEmail({
        to: booking.email,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        replyTo: 'info@bookaride.co.nz',
      }).then(ok => {
        if (ok) console.log(`Customer confirmation email sent for booking #${refNumber}`);
        else console.error(`CRITICAL: Customer confirmation email returned false for booking #${refNumber}`);
      }).catch(err => {
        console.error(`CRITICAL: Customer confirmation email threw for booking #${refNumber}: ${err.message}`);
      });
    } catch (templateErr) {
      console.error(`Customer email template error for booking #${refNumber}: ${templateErr.message}`);
    }

    // 2. Send admin notification (fire-and-forget)
    try {
      const adminTemplate = adminNewBookingEmail(bookingDoc, { requiresApproval });
      sendEmail({
        to: adminEmail,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
      }).then(ok => {
        if (ok) console.log(`Admin notification sent for booking #${refNumber} to ${adminEmail}`);
        else console.error(`CRITICAL: Admin notification returned false for booking #${refNumber}`);
      }).catch(err => {
        console.error(`CRITICAL: Admin notification threw for booking #${refNumber}: ${err.message}`);
      });
    } catch (templateErr) {
      console.error(`Admin email template error for booking #${refNumber}: ${templateErr.message}`);
    }

    return res.status(201).json(bookingDoc);
  } catch (err) {
    console.error('CRITICAL: Unhandled error in createBooking:', err);
    return res.status(500).json({
      detail: `Error creating booking: ${err.message}. Please try again or contact us at info@bookaride.co.nz`,
    });
  }
}

async function listBookings(req, res) {
  try {
    // TODO: Add JWT auth check for admin
    const bookings = await findMany('bookings', {}, {
      limit: 200,
      sort: { createdAt: -1 },
    });

    // Exclude shuttle bookings (shuttle service removed)
    const filtered = bookings.filter(b => b.serviceType !== 'shared-shuttle');

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('Error listing bookings:', err);
    return res.status(500).json({ detail: `Error listing bookings: ${err.message}` });
  }
}
