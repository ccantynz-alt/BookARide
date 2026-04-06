/**
 * Shared email templates for BookARide customer and admin emails.
 * All templates use Outlook-safe HTML table layouts.
 */

function formatPrice(amount) {
  const n = parseFloat(amount || 0);
  return n.toFixed(2);
}

function customerName(booking) {
  return (
    `${booking.firstName || ''} ${booking.lastName || ''}`.trim() ||
    booking.name ||
    'Customer'
  );
}

/**
 * Core booking details table (reused across all booking emails)
 */
function bookingDetailsTable(booking) {
  const flightNum =
    booking.flightNumber ||
    booking.departureFlightNumber ||
    booking.arrivalFlightNumber ||
    '';
  const returnFlightNum =
    booking.returnDepartureFlightNumber || booking.returnFlightNumber || '';

  return `
    <table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; margin:20px 0;">
      <tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Reference</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">#${booking.referenceNumber || booking.id?.slice(0, 5)}</td></tr>
      <tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Pickup</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${booking.pickupAddress || 'N/A'}</td></tr>
      <tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Dropoff</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${booking.dropoffAddress || 'N/A'}</td></tr>
      <tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Date</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${booking.date || 'N/A'} at ${booking.time || 'N/A'}</td></tr>
      <tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Passengers</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${booking.passengers || 1}</td></tr>
      ${flightNum ? `<tr><td style="padding:10px 12px; background:#f8f8f8; border-bottom:1px solid #eee;"><strong>Flight</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${flightNum}</td></tr>` : ''}
      ${booking.bookReturn && booking.returnDate ? `
        <tr><td style="padding:10px 12px; background:#f3e8ff; border-bottom:1px solid #eee;"><strong>Return Date</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${booking.returnDate} at ${booking.returnTime || 'N/A'}</td></tr>
        ${returnFlightNum ? `<tr><td style="padding:10px 12px; background:#f3e8ff; border-bottom:1px solid #eee;"><strong>Return Flight</strong></td><td style="padding:10px 12px; border-bottom:1px solid #eee;">${returnFlightNum}</td></tr>` : ''}
      ` : ''}
      <tr><td style="padding:10px 12px; background:#f8f8f8;"><strong>Total</strong></td><td style="padding:10px 12px;"><strong style="font-size:16px;">$${formatPrice(booking.pricing?.totalPrice || booking.totalPrice)} NZD</strong></td></tr>
    </table>
  `;
}

function emailWrapper(innerHtml, preheader = '') {
  return `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:20px; color:#333;">
      ${preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${preheader}</div>` : ''}
      ${innerHtml}
      <div style="margin-top:40px; padding-top:20px; border-top:1px solid #eee; font-size:12px; color:#888; text-align:center;">
        <p style="margin:0;">BookARide NZ &mdash; Professional Airport Transfers</p>
        <p style="margin:5px 0 0 0;"><a href="https://bookaride.co.nz" style="color:#888; text-decoration:none;">bookaride.co.nz</a> &middot; <a href="mailto:info@bookaride.co.nz" style="color:#888; text-decoration:none;">info@bookaride.co.nz</a></p>
      </div>
    </div>
  `;
}

/**
 * Customer booking received email (initial, unpaid)
 */
function customerBookingReceivedEmail(booking, { requiresApproval = false } = {}) {
  const name = customerName(booking);
  const body = `
    <h2 style="color:#1a1a1a; margin-top:0;">Thank you for your booking!</h2>
    <p>Hi ${name},</p>
    <p>We've received your booking request. ${
      requiresApproval
        ? '<strong style="color:#d97706;">Your booking is within 24 hours and requires admin approval. You\'ll hear from us shortly.</strong>'
        : 'Your booking is being processed.'
    }</p>
    ${bookingDetailsTable(booking)}
    <p style="margin-top:20px;"><strong>Next step:</strong> Complete your payment using the link you'll receive separately, or click the pay button on your booking confirmation page.</p>
    <p>If you have any questions, just reply to this email or contact us at <a href="mailto:info@bookaride.co.nz">info@bookaride.co.nz</a>.</p>
  `;
  return {
    subject: `Booking Received - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your booking #${booking.referenceNumber} has been received`),
  };
}

/**
 * Customer booking confirmed (paid) email
 */
function customerBookingConfirmedEmail(booking) {
  const name = customerName(booking);
  const body = `
    <h2 style="color:#059669; margin-top:0;">Payment Successful!</h2>
    <p>Hi ${name},</p>
    <p>Your booking has been <strong>confirmed</strong> and payment received. Your driver will arrive at the scheduled time.</p>
    ${bookingDetailsTable(booking)}
    <p style="margin-top:20px;"><strong>Payment Status:</strong> <span style="background:#d1fae5; color:#047857; padding:4px 12px; border-radius:4px; font-weight:bold;">PAID</span></p>
    <p style="margin-top:20px;">Thank you for choosing BookARide. We'll be in touch if anything changes.</p>
  `;
  return {
    subject: `Booking Confirmed - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your booking #${booking.referenceNumber} is confirmed`),
  };
}

/**
 * Payment link email (sent when Stripe checkout is created or resent by admin)
 */
function customerPaymentLinkEmail(booking, paymentUrl) {
  const name = customerName(booking);
  const amount = formatPrice(booking.pricing?.totalPrice || booking.totalPrice);
  const body = `
    <h2 style="color:#1a1a1a; margin-top:0;">Complete Your Payment</h2>
    <p>Hi ${name},</p>
    <p>Please complete payment for your booking using the secure link below.</p>
    ${bookingDetailsTable(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
      <tr><td align="center">
        <a href="${paymentUrl}" style="background:#1a1a1a; color:#fff; padding:16px 48px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px; display:inline-block;">Pay $${amount} NZD Securely</a>
      </td></tr>
    </table>
    <p style="font-size:12px; color:#666;">Or copy this link into your browser: <a href="${paymentUrl}" style="color:#1a1a1a; word-break:break-all;">${paymentUrl}</a></p>
    <p style="font-size:12px; color:#666; margin-top:20px;">Your payment is processed securely via Stripe. BookARide never stores your card details.</p>
  `;
  return {
    subject: `Complete Your Payment - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Pay $${amount} to confirm your booking`),
  };
}

/**
 * Admin notification — new booking
 */
function adminNewBookingEmail(booking, { requiresApproval = false } = {}) {
  const name = customerName(booking);
  const body = `
    <h2>New Booking #${booking.referenceNumber}</h2>
    ${requiresApproval ? '<p style="background:#fee2e2; color:#991b1b; padding:12px; border-radius:4px; font-weight:bold;">Within 24 hours &mdash; requires manual approval</p>' : ''}
    <p><strong>Customer:</strong> ${name}</p>
    <p><strong>Email:</strong> ${booking.email || 'N/A'}</p>
    <p><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
    ${bookingDetailsTable(booking)}
    <p style="margin-top:20px;"><a href="https://bookaride.co.nz/admin/login" style="background:#1a1a1a; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">View in Admin Dashboard</a></p>
  `;
  return {
    subject: requiresApproval
      ? `URGENT: Booking #${booking.referenceNumber} needs approval (within 24hrs)`
      : `New Booking #${booking.referenceNumber} - ${name}`,
    html: emailWrapper(body),
  };
}

/**
 * Reminder email for tomorrow's bookings
 */
function customerReminderEmail(booking) {
  const name = customerName(booking);
  const body = `
    <h2 style="color:#1a1a1a; margin-top:0;">Friendly Reminder: Your Trip Tomorrow</h2>
    <p>Hi ${name},</p>
    <p>Just a reminder that your BookARide transfer is scheduled for <strong>tomorrow</strong>. Here are your booking details:</p>
    ${bookingDetailsTable(booking)}
    <p style="margin-top:20px;"><strong>Please ensure:</strong></p>
    <ul>
      <li>You're ready at the pickup address 5 minutes before the scheduled time</li>
      <li>Your flight number is up to date (if this is an airport transfer)</li>
      <li>You have our contact number handy: info@bookaride.co.nz</li>
    </ul>
    <p>See you tomorrow!</p>
  `;
  return {
    subject: `Reminder: Your BookARide trip tomorrow - Ref #${booking.referenceNumber}`,
    html: emailWrapper(body, `Your BookARide trip is tomorrow`),
  };
}

module.exports = {
  formatPrice,
  customerName,
  bookingDetailsTable,
  emailWrapper,
  customerBookingReceivedEmail,
  customerBookingConfirmedEmail,
  customerPaymentLinkEmail,
  adminNewBookingEmail,
  customerReminderEmail,
};
