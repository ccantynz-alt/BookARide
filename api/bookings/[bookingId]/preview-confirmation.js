/**
 * GET /api/bookings/:bookingId/preview-confirmation
 * Returns the HTML that would be sent as the booking confirmation email,
 * so admin can preview it before sending.
 */
const { findOne } = require('../../_lib/db');
const {
  customerBookingReceivedEmail,
  customerBookingConfirmedEmail,
} = require('../../_lib/email-templates');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).json({ detail: 'bookingId is required' });
  }

  try {
    const booking = await findOne('bookings', { id: bookingId });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    const template =
      booking.payment_status === 'paid'
        ? customerBookingConfirmedEmail(booking)
        : customerBookingReceivedEmail(booking);

    return res.status(200).json({
      html: template.html,
      subject: template.subject,
      booking: {
        email: booking.email,
        name: `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Customer',
        phone: booking.phone,
        ccEmail: booking.ccEmail || '',
      },
    });
  } catch (err) {
    console.error('Error previewing confirmation:', err);
    return res.status(500).json({ detail: `Error previewing confirmation: ${err.message}` });
  }
};
