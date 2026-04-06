/**
 * POST /api/send-booking-email
 * Send a custom email to a customer about their booking.
 * Used by the admin dashboard's "Send Email" button.
 *
 * Request body: { booking_id, to, cc, subject, message }
 */
const { findOne } = require('./_lib/db');
const { sendEmail } = require('./_lib/mailgun');
const { emailWrapper, bookingDetailsTable, customerName } = require('./_lib/email-templates');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { booking_id, to, cc, subject, message } = req.body || {};

    if (!to || !subject || !message) {
      return res.status(400).json({ detail: 'to, subject, and message are required' });
    }

    // If a booking ID was provided, include booking details in the footer
    let bookingFooter = '';
    let booking = null;
    if (booking_id) {
      booking = await findOne('bookings', { id: booking_id });
      if (booking) {
        bookingFooter = `
          <div style="margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
            <p style="color:#666; font-size:13px; margin:0 0 10px 0;"><strong>Your Booking Details:</strong></p>
            ${bookingDetailsTable(booking)}
          </div>
        `;
      }
    }

    const name = booking ? customerName(booking) : '';
    const greeting = name ? `<p>Hi ${name},</p>` : '';

    // Convert message newlines to <br> for proper HTML display
    const messageHtml = String(message)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const body = `
      <h2 style="color:#1a1a1a; margin-top:0;">${String(subject).replace(/</g, '&lt;')}</h2>
      ${greeting}
      <div style="line-height:1.6;">${messageHtml}</div>
      ${bookingFooter}
    `;

    const html = emailWrapper(body);

    const success = await sendEmail({
      to,
      cc: cc || undefined,
      subject,
      html,
      replyTo: 'info@bookaride.co.nz',
    });

    if (!success) {
      return res.status(500).json({ detail: 'Failed to send email' });
    }

    console.log(`Custom booking email sent to ${to}${cc ? ` (cc: ${cc})` : ''}`);
    return res.status(200).json({
      success: true,
      message: `Email sent to ${to}`,
    });
  } catch (err) {
    console.error('Error sending custom email:', err);
    return res.status(500).json({ detail: `Error sending email: ${err.message}` });
  }
};
