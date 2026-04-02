/**
 * POST /api/bookings/:bookingId/resend-payment-link
 * Generate and send a payment link to the customer.
 * Also returns the link so admin can copy it manually if email fails.
 */
const { findOne, updateOne } = require('../../_lib/db');
const { sendEmail } = require('../../_lib/mailgun');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { bookingId } = req.query;
    if (!bookingId) {
      return res.status(400).json({ detail: 'bookingId is required' });
    }

    const booking = await findOne('bookings', { id: bookingId });
    if (!booking) {
      return res.status(404).json({ detail: 'Booking not found' });
    }

    // Build payment link
    const publicDomain = (process.env.PUBLIC_DOMAIN || 'https://www.bookaride.co.nz').replace(/\/$/, '');
    const paymentLink = `${publicDomain}/pay/${bookingId}`;
    const totalPrice = booking.totalPrice || booking.pricing?.totalPrice || 0;
    const customerName = booking.name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer';
    const ref = booking.referenceNumber || bookingId.slice(0, 8);

    // Try to send email
    let emailSent = false;
    if (booking.email) {
      emailSent = await sendEmail({
        to: booking.email,
        subject: `Payment Link - Booking #${ref} - $${totalPrice} NZD`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#D4AF37;padding:20px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Book A Ride NZ</h1>
            </div>
            <div style="padding:30px 20px;">
              <p>Dear ${customerName},</p>
              <p>Thank you for your booking with BookARide NZ. Please complete your payment using the secure link below.</p>

              <div style="background:#f9f9f9;border:2px solid #D4AF37;padding:20px;text-align:center;margin:20px 0;">
                <p style="color:#666;font-size:14px;margin:0;">Amount Due</p>
                <p style="color:#1a1a1a;font-size:36px;font-weight:bold;margin:10px 0;">$${Number(totalPrice).toFixed(2)} NZD</p>
                <p style="color:#666;font-size:12px;margin:0;">via Credit/Debit Card</p>
              </div>

              <div style="text-align:center;margin:30px 0;">
                <a href="${paymentLink}" style="background:#D4AF37;color:#000;padding:16px 40px;text-decoration:none;font-weight:bold;border-radius:6px;display:inline-block;font-size:16px;">Pay Now Securely</a>
              </div>

              <p style="font-size:13px;color:#666;">Or copy this link:<br/>
                <a href="${paymentLink}" style="color:#D4AF37;word-break:break-all;">${paymentLink}</a>
              </p>

              <p style="font-size:12px;color:#999;">Your payment is processed securely. BookARide NZ never stores your card details.</p>
            </div>
          </div>
        `,
        fromName: 'BookaRide NZ',
        replyTo: 'info@bookaride.co.nz',
      });
    }

    // Track that payment link was sent
    await updateOne('bookings', { id: bookingId }, {
      $set: {
        payment_link_sent_at: new Date().toISOString(),
        payment_link_url: paymentLink,
      },
    });

    return res.status(200).json({
      message: emailSent
        ? `Payment link sent to ${booking.email}`
        : `Payment link generated (email delivery failed — copy link below)`,
      payment_link: paymentLink,
      email_sent: emailSent,
    });
  } catch (err) {
    console.error('Resend payment link error:', err.message);
    return res.status(500).json({ detail: `Failed to send payment link: ${err.message}` });
  }
};
