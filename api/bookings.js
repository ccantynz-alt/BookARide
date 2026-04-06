/**
 * POST /api/bookings — Create a new booking
 * GET  /api/bookings — List bookings (admin, requires auth)
 *
 * Replaces: Python backend POST /api/bookings, GET /api/bookings
 */
const { findOne, findMany, insertOne, updateOne, getDb } = require('./_lib/db');
const { sendEmail } = require('./_lib/mailgun');
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

    const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Customer';
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';

    // Build reusable HTML booking details block
    const bookingDetailsHtml = `
      <table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif;">
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Reference:</strong></td><td style="padding:8px;">#${refNumber}</td></tr>
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Pickup:</strong></td><td style="padding:8px;">${booking.pickupAddress}</td></tr>
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Dropoff:</strong></td><td style="padding:8px;">${booking.dropoffAddress}</td></tr>
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Date:</strong></td><td style="padding:8px;">${booking.date} at ${booking.time}</td></tr>
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Passengers:</strong></td><td style="padding:8px;">${booking.passengers || 1}</td></tr>
        ${outboundFlight ? `<tr><td style="padding:8px; background:#f8f8f8;"><strong>Flight:</strong></td><td style="padding:8px;">${outboundFlight}</td></tr>` : ''}
        <tr><td style="padding:8px; background:#f8f8f8;"><strong>Total:</strong></td><td style="padding:8px;"><strong>$${bookingDoc.totalPrice} NZD</strong></td></tr>
      </table>
    `;

    // 1. Send CUSTOMER confirmation email (fire-and-forget)
    if (booking.email) {
      sendEmail({
        to: booking.email,
        subject: `Booking Received - Ref #${refNumber} - BookARide`,
        html: `
          <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:20px;">
            <h2 style="color:#1a1a1a;">Thank you for your booking!</h2>
            <p>Hi ${customerName},</p>
            <p>We've received your booking request. ${requiresApproval ? '<strong style="color:#d97706;">Your booking is within 24 hours and requires admin approval. You\'ll hear from us shortly.</strong>' : 'Your booking is being processed.'}</p>
            ${bookingDetailsHtml}
            <p style="margin-top:20px;"><strong>Payment:</strong> You'll receive a payment link separately, or complete payment now on the booking page.</p>
            <p>If you have any questions, reply to this email or contact us at <a href="mailto:info@bookaride.co.nz">info@bookaride.co.nz</a>.</p>
            <p style="margin-top:30px; color:#666; font-size:12px;">BookARide NZ — Auckland Airport Transfers</p>
          </div>`,
      }).catch(err => console.error(`CRITICAL: Customer confirmation email failed for booking #${refNumber}:`, err.message));
    } else {
      console.error(`CRITICAL: Booking #${refNumber} has no customer email — cannot send confirmation`);
    }

    // 2. Send admin notification (fire-and-forget, don't block response)
    sendEmail({
      to: adminEmail,
      subject: requiresApproval
        ? `URGENT: Booking #${refNumber} needs approval (within 24hrs)`
        : `New Booking #${refNumber} - ${customerName}`,
      html: `
        <div style="font-family:Arial,sans-serif; max-width:600px;">
          <h2>New Booking #${refNumber}</h2>
          ${requiresApproval ? '<p style="color:red; font-weight:bold;">Within 24 hours — requires manual approval</p>' : ''}
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          ${bookingDetailsHtml}
          <p style="margin-top:20px;"><a href="https://bookaride.co.nz/admin/login" style="background:#1a1a1a; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">View in Admin Dashboard</a></p>
        </div>`,
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
