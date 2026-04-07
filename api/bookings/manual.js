/**
 * POST /api/bookings/manual
 * Create a booking manually from admin panel.
 * Requires admin auth token.
 */
const { findOne, insertOne, updateOne, getDb } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { v4: uuidv4 } = require('uuid');

async function getNextReferenceNumber() {
  const sql = getDb();
  try {
    const result = await sql`
      INSERT INTO counters (id, data)
      VALUES ('booking_reference', '{"name": "booking_reference", "value": 1}'::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = jsonb_set(counters.data, '{value}', to_jsonb((counters.data->>'value')::int + 1))
      RETURNING (data->>'value')::int as value
    `;
    if (result && result.length > 0) return result[0].value;
  } catch (err) {
    console.error('Counter increment failed:', err.message);
  }
  const sql2 = getDb();
  const maxRef = await sql2`
    SELECT MAX((data->>'referenceNumber')::int) as max_ref FROM bookings
    WHERE data->>'referenceNumber' IS NOT NULL
  `.catch(() => [{ max_ref: 0 }]);
  return (parseInt(maxRef[0]?.max_ref) || 0) + 1;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const booking = req.body;
    const id = uuidv4();
    const refNumber = await getNextReferenceNumber();

    // Resolve price: use override if provided, otherwise pricing.totalPrice
    let totalPrice = 0;
    if (booking.priceOverride && booking.priceOverride > 0) {
      totalPrice = parseFloat(booking.priceOverride);
    } else if (booking.pricing && booking.pricing.totalPrice) {
      totalPrice = parseFloat(booking.pricing.totalPrice);
    }

    // Determine payment status
    let paymentStatus = 'unpaid';
    if (booking.paymentMethod === 'card') paymentStatus = 'paid';
    else if (booking.paymentMethod === 'pay-on-pickup' || booking.paymentMethod === 'cash') paymentStatus = booking.paymentMethod;

    const customerName = booking.name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer';

    const bookingDoc = {
      id,
      referenceNumber: String(refNumber),
      name: customerName,
      email: booking.email || '',
      ccEmail: booking.ccEmail || '',
      phone: booking.phone || '',
      serviceType: booking.serviceType || 'airport-transfer',
      pickupAddress: booking.pickupAddress || '',
      dropoffAddress: booking.dropoffAddress || '',
      date: booking.date || '',
      time: booking.time || '',
      passengers: booking.passengers || 1,
      pricing: booking.pricing || { totalPrice },
      totalPrice,
      notes: booking.notes || '',
      status: 'confirmed',
      payment_status: paymentStatus,
      payment_method: booking.paymentMethod || 'stripe',
      flightArrivalNumber: booking.flightArrivalNumber || '',
      flightArrivalTime: booking.flightArrivalTime || '',
      flightDepartureNumber: booking.flightDepartureNumber || '',
      flightDepartureTime: booking.flightDepartureTime || '',
      bookReturn: booking.bookReturn || false,
      returnDate: booking.returnDate || '',
      returnTime: booking.returnTime || '',
      returnDepartureFlightNumber: booking.returnDepartureFlightNumber || '',
      returnFlightNumber: booking.returnFlightNumber || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert and verify
    const result = await insertOne('bookings', bookingDoc);
    if (!result.acknowledged) {
      console.error(`CRITICAL: Manual booking insert not acknowledged for #${refNumber}`);
      return res.status(500).json({ detail: 'Failed to save booking' });
    }
    const verified = await findOne('bookings', { id });
    if (!verified) {
      console.error(`CRITICAL: Manual booking #${refNumber} not found after insert`);
      return res.status(500).json({ detail: 'Booking verification failed' });
    }

    console.log(`Manual booking created: #${refNumber} - ${customerName}`);

    // Send admin notification
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    sendEmail({
      to: adminEmail,
      subject: `New Manual Booking #${refNumber} - ${customerName}`,
      html: `<h2>Manual Booking #${refNumber}</h2>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Pickup:</strong> ${booking.pickupAddress}</p>
        <p><strong>Dropoff:</strong> ${booking.dropoffAddress}</p>
        <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
        <p><strong>Passengers:</strong> ${booking.passengers}</p>
        <p><strong>Total:</strong> $${totalPrice}</p>
        <p><strong>Payment:</strong> ${booking.paymentMethod || 'stripe'}</p>`,
    }).catch(err => console.error('Admin notification failed:', err.message));

    // If Stripe payment, send payment link to customer
    if (booking.paymentMethod === 'stripe' && booking.email) {
      const publicDomain = (process.env.PUBLIC_DOMAIN || 'https://www.bookaride.co.nz').replace(/\/$/, '');
      const paymentLink = `${publicDomain}/pay/${id}`;
      sendEmail({
        to: booking.email,
        subject: `Payment Link - Booking #${refNumber} - $${totalPrice} NZD`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#D4AF37;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;">Book A Ride NZ</h1>
          </div>
          <div style="padding:30px 20px;">
            <p>Dear ${customerName},</p>
            <p>Thank you for your booking. Please complete your payment below.</p>
            <div style="background:#f9f9f9;border:2px solid #D4AF37;padding:20px;text-align:center;margin:20px 0;">
              <p style="color:#666;font-size:14px;margin:0;">Amount Due</p>
              <p style="color:#1a1a1a;font-size:36px;font-weight:bold;margin:10px 0;">$${Number(totalPrice).toFixed(2)} NZD</p>
            </div>
            <div style="text-align:center;margin:30px 0;">
              <a href="${paymentLink}" style="background:#D4AF37;color:#000;padding:16px 40px;text-decoration:none;font-weight:bold;border-radius:6px;display:inline-block;">Pay Now Securely</a>
            </div>
          </div>
        </div>`,
        fromName: 'BookaRide NZ',
        replyTo: 'info@bookaride.co.nz',
      }).catch(err => console.error('Payment link email failed:', err.message));
    }

    return res.status(201).json(bookingDoc);
  } catch (err) {
    console.error('Error creating manual booking:', err);
    return res.status(500).json({ detail: `Error creating booking: ${err.message}` });
  }
};
