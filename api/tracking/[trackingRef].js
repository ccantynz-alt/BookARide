/**
 * GET /api/tracking/:trackingRef
 *
 * Public customer-tracking endpoint. Returns the current state of a
 * booking by its short tracking reference. Customers receive this URL
 * in their confirmation email and can hit it without auth — it returns
 * only public-safe fields (no email, no phone, no driver contact).
 *
 * Real-time GPS (currentLocation) is null today — feature is reserved
 * for the live driver-tracking integration.
 */
const { findOne } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const { trackingRef } = req.query;
  if (!trackingRef) return res.status(400).json({ detail: 'trackingRef is required' });

  try {
    // The tracking ref may match either booking.id, booking.referenceNumber,
    // or booking.trackingReference. Try each.
    let booking = await findOne('bookings', { id: String(trackingRef) });
    if (!booking) booking = await findOne('bookings', { referenceNumber: String(trackingRef) });
    if (!booking) booking = await findOne('bookings', { trackingReference: String(trackingRef) });

    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found for this tracking reference' });
    }

    return res.status(200).json({
      status: booking.status || 'pending',
      paymentStatus: booking.payment_status || 'unpaid',
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      pickupDate: booking.date,
      pickupTime: booking.time,
      passengers: booking.passengers,
      driverName: booking.assignedDriverName || booking.driverName || null,
      driverVehicle: booking.assignedDriverVehicle || null,
      currentLocation: null,
      etaMinutes: null,
      referenceNumber: booking.referenceNumber || booking.id,
    });
  } catch (err) {
    console.error('Tracking lookup error:', err.message);
    return res.status(500).json({ detail: 'Failed to load tracking information' });
  }
};
