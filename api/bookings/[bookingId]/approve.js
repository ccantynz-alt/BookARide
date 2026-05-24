/**
 * POST /api/bookings/:bookingId/approve
 *
 * Approve a pending_approval booking: marks it confirmed and sends the
 * customer an approval notification email. This is the correct path for
 * last-minute (within 24h) bookings that the admin manually authorises.
 *
 * Using this endpoint instead of the generic PATCH ensures the customer
 * actually gets notified — PATCH alone only updates the database.
 */
const { findOne, updateOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');
const { verifyAdmin } = require('../../_lib/auth');
const {
  customerBookingApprovedEmail,
  adminNewBookingEmail,
} = require('../../_lib/email-templates');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
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

    if (booking.status !== 'pending_approval') {
      return res.status(400).json({
        detail: `Booking status is '${booking.status}' — only pending_approval bookings can be approved here`,
      });
    }

    // Update status to confirmed
    await updateOne('bookings', { id: bookingId }, {
      $set: {
        status: 'confirmed',
        approved_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    const approvedBooking = { ...booking, status: 'confirmed' };

    // Send customer approval email
    let customerEmailSent = false;
    if (booking.email) {
      const template = customerBookingApprovedEmail(approvedBooking);
      customerEmailSent = await sendEmail({
        to: booking.email,
        subject: template.subject,
        html: template.html,
        replyTo: 'info@bookaride.co.nz',
      }).catch(err => {
        console.error(`CRITICAL: Approval email failed for booking #${booking.referenceNumber}: ${err.message}`);
        return false;
      });
    }

    if (customerEmailSent) {
      console.error(`Booking #${booking.referenceNumber} approved — confirmation sent to ${booking.email}`);
    } else {
      console.error(`CRITICAL: Booking #${booking.referenceNumber} approved but email failed (check MAILGUN_API_KEY)`);
    }

    // Admin confirmation that the approval went through
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    const adminTemplate = adminNewBookingEmail(approvedBooking);
    await sendEmail({
      to: adminEmail,
      subject: `APPROVED: Booking #${booking.referenceNumber} — customer ${customerEmailSent ? 'notified' : 'NOT notified (email failed)'}`,
      html: adminTemplate.html,
    }).catch(err => console.error(`Admin approval notification failed: ${err.message}`));

    return res.status(200).json({
      success: true,
      booking: approvedBooking,
      customer_email_sent: customerEmailSent,
      message: customerEmailSent
        ? `Booking approved and confirmation sent to ${booking.email}`
        : 'Booking approved — but the email failed. Check MAILGUN_API_KEY in Vercel.',
    });
  } catch (err) {
    console.error('Approve booking error:', err.message);
    return res.status(500).json({ detail: `Error approving booking: ${err.message}` });
  }
};
