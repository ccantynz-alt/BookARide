/**
 * POST /api/bookings/:bookingId/resend-confirmation
 * Resend the booking confirmation email to the customer.
 * Replaces: Python backend POST /api/bookings/:id/resend-confirmation
 */
const { findOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');
const {
  customerBookingReceivedEmail,
  customerBookingConfirmedEmail,
} = require('../../_lib/email-templates');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).json({ detail: 'bookingId is required' });
  }

  try {
    const booking = await findOne('bookings', { id: bookingId });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    if (!booking.email) {
      return res.status(400).json({ detail: 'Booking has no customer email' });
    }

    // Send the appropriate email based on payment status
    const template =
      booking.payment_status === 'paid'
        ? customerBookingConfirmedEmail(booking)
        : customerBookingReceivedEmail(booking);

    const success = await sendEmail({
      to: booking.email,
      subject: template.subject,
      html: template.html,
      replyTo: 'info@bookaride.co.nz',
    });

    if (!success) {
      console.error(`CRITICAL: Resend confirmation failed for booking #${booking.referenceNumber}`);
      return res.status(500).json({ detail: 'Failed to send confirmation email' });
    }

    console.log(`Confirmation resent for booking #${booking.referenceNumber} to ${booking.email}`);
    return res.status(200).json({
      success: true,
      message: `Confirmation email sent to ${booking.email}`,
    });
  } catch (err) {
    console.error('Error resending confirmation:', err);
    return res.status(500).json({ detail: `Error resending confirmation: ${err.message}` });
  }
};
