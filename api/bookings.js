/**
 * POST /api/bookings — Create a new booking
 * GET  /api/bookings — List bookings (admin)
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

    // Send admin notification (fire-and-forget, don't block response)
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    sendEmail({
      to: adminEmail,
      subject: requiresApproval
        ? `URGENT: Booking #${refNumber} needs approval (within 24hrs)`
        : `New Booking #${refNumber} - ${booking.firstName} ${booking.lastName}`,
      html: `<h2>New Booking #${refNumber}</h2>
        <p><strong>Name:</strong> ${booking.firstName} ${booking.lastName}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Pickup:</strong> ${booking.pickupAddress}</p>
        <p><strong>Dropoff:</strong> ${booking.dropoffAddress}</p>
        <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
        <p><strong>Passengers:</strong> ${booking.passengers}</p>
        <p><strong>Total:</strong> $${bookingDoc.totalPrice}</p>
        ${requiresApproval ? '<p style="color: red; font-weight: bold;">Within 24 hours — requires manual approval</p>' : ''}`,
    }).catch(err => console.error('Admin notification failed:', err.message));

    return res.status(201).json(bookingDoc);
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ detail: `Error creating booking: ${err.message}` });
  }
}

async function listBookings(req, res) {
  try {
    const sql = getDb();

    // Parse query parameters from the frontend
    const page = parseInt(req.query.page) || 1;
    const limitParam = parseInt(req.query.limit);
    // limit=0 means "load all" (frontend convention) — cap at 5000
    const limit = limitParam === 0 ? 5000 : (limitParam || 5000);
    const offset = (page - 1) * (limitParam === 0 ? 0 : (limitParam || 5000));
    const search = req.query.search || '';
    const dateFrom = req.query.date_from || '';
    const dateTo = req.query.date_to || '';

    // Build query — exclude shared-shuttle (removed service)
    let conditions = [`data->>'serviceType' != 'shared-shuttle' OR data->>'serviceType' IS NULL`];
    let values = [];
    let paramIdx = 1;

    // Date filters
    if (dateFrom) {
      conditions.push(`data->>'date' >= $${paramIdx}`);
      values.push(dateFrom);
      paramIdx++;
    }
    if (dateTo) {
      conditions.push(`data->>'date' <= $${paramIdx}`);
      values.push(dateTo);
      paramIdx++;
    }

    // Search filter
    if (search) {
      conditions.push(`(
        data->>'name' ILIKE $${paramIdx} OR
        data->>'email' ILIKE $${paramIdx} OR
        data->>'phone' ILIKE $${paramIdx} OR
        data->>'referenceNumber' ILIKE $${paramIdx} OR
        data->>'pickupAddress' ILIKE $${paramIdx} OR
        data->>'dropoffAddress' ILIKE $${paramIdx}
      )`);
      values.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT data FROM bookings
      ${whereClause}
      ORDER BY
        CASE WHEN data->>'date' >= CURRENT_DATE::text THEN 0 ELSE 1 END,
        data->>'date' ASC, data->>'time' ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await sql(query, values);
    const bookings = rows.map(r => r.data);

    return res.status(200).json(bookings);
  } catch (err) {
    console.error('Error listing bookings:', err);
    return res.status(500).json({ detail: `Error listing bookings: ${err.message}` });
  }
}
