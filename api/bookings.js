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
    const booking = req.body;

    if (!booking.pickupAddress || !booking.dropoffAddress) {
      return res.status(400).json({ detail: 'pickupAddress and dropoffAddress are required' });
    }

    // Generate unique ID and reference number
    const id = uuidv4();
    const refNumber = await getNextReferenceNumber();
    const nzDate = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });

    // Normalize flight number fields
    const outboundFlight = booking.flightNumber || booking.departureFlightNumber || booking.arrivalFlightNumber || '';
    const returnFlight = booking.returnDepartureFlightNumber || booking.returnFlightNumber || '';

    // Check if within 24 hours
    const requiresApproval = isWithin24Hours(booking.date, booking.time);

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
      totalPrice: booking.pricing?.totalPrice || 0,
      payment_status: 'unpaid',
      payment_method: booking.paymentMethod || 'stripe',
      serviceType: booking.serviceType || 'airport-transfer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert into database
    const result = await insertOne('bookings', bookingDoc);
    if (!result.acknowledged) {
      console.error(`CRITICAL: Database insert not acknowledged for booking #${refNumber}`);
      return res.status(500).json({ detail: 'Failed to save booking to database' });
    }

    // Verify the booking was saved
    const saved = await findOne('bookings', { id });
    if (!saved) {
      console.error(`CRITICAL: Booking #${refNumber} not found after insert — potential data loss!`);
      return res.status(500).json({ detail: 'Booking verification failed' });
    }

    console.log(`Booking created and verified: ${id} with reference #${refNumber}`);

    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';

    // 1. Send CUSTOMER confirmation email (fire-and-forget)
    if (booking.email) {
      const customerTemplate = customerBookingReceivedEmail(bookingDoc, { requiresApproval });
      sendEmail({
        to: booking.email,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        replyTo: 'info@bookaride.co.nz',
      }).catch(err => console.error(`CRITICAL: Customer confirmation email failed for booking #${refNumber}:`, err.message));
    } else {
      console.error(`CRITICAL: Booking #${refNumber} has no customer email — cannot send confirmation`);
    }

    // 2. Send admin notification (fire-and-forget, don't block response)
    const adminTemplate = adminNewBookingEmail(bookingDoc, { requiresApproval });
    sendEmail({
      to: adminEmail,
      subject: adminTemplate.subject,
      html: adminTemplate.html,
    }).catch(err => console.error(`CRITICAL: Admin notification failed for booking #${refNumber}:`, err.message));

    return res.status(201).json(bookingDoc);
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ detail: `Error creating booking: ${err.message}` });
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
