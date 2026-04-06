/**
 * POST /api/bookings/:bookingId/send-to-admin
 * Send full booking details to the admin email address.
 */
const { findOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');
const { adminNewBookingEmail } = require('../../_lib/email-templates');

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

    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    const template = adminNewBookingEmail(booking);

    const success = await sendEmail({
      to: adminEmail,
      subject: `[Manual Send] ${template.subject}`,
      html: template.html,
    });

    if (!success) {
      return res.status(500).json({ detail: 'Failed to send admin notification' });
    }

    console.log(`Booking #${booking.referenceNumber} details sent to admin ${adminEmail}`);
    return res.status(200).json({
      success: true,
      message: `Booking details sent to ${adminEmail}`,
    });
  } catch (err) {
    console.error('Error sending to admin:', err);
    return res.status(500).json({ detail: `Error sending to admin: ${err.message}` });
  }
};
