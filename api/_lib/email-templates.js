/**
 * Shared email templates for BookARide customer and admin emails.
 * All templates use Outlook-safe HTML table layouts.
 *
 * Brand palette (locked, do not change without Craig's approval):
 *   GOLD       #D4AF37   accents, headings, button background
 *   GOLD_DARK  #B8941F   button hover/border
 *   INK        #1a1a1a   primary body text
 *   PAPER      #FFFFFF   email background
 *   CREAM      #FAF7F0   alternating row stripe / details panel
 *   MUTE       #6b7280   secondary text
 */

const GOLD       = '#D4AF37';
const GOLD_DARK  = '#B8941F';
const INK        = '#1a1a1a';
const CREAM      = '#FAF7F0';
const MUTE       = '#6b7280';
const BORDER     = '#E5DCC3';

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
 * Render a 24-hour time string ("14:30", "9:05", "08:00") as
 * "14:30 (2:30 PM)" — keeps the 24-hour format for accuracy AND
 * adds the 12-hour version because most New Zealand customers
 * read the 12-hour format faster. If the input isn't a valid
 * HH:MM string, falls back to whatever was passed in.
 */
function formatTime12(time24) {
  if (!time24 || typeof time24 !== 'string') return time24 || 'N/A';
  const m = time24.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time24;
  let h = parseInt(m[1], 10);
  const mins = m[2];
  if (Number.isNaN(h) || h < 0 || h > 23) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${time24} (${h12}:${mins} ${period})`;
}

function bookingDetailsTable(booking) {
  const flightNum =
    booking.flightNumber ||
    booking.departureFlightNumber ||
    booking.arrivalFlightNumber ||
    '';
  const returnFlightNum =
    booking.returnDepartureFlightNumber || booking.returnFlightNumber || '';

  const labelStyle = `padding:12px 14px; background:${CREAM}; border-bottom:1px solid ${BORDER}; font-size:13px; color:${MUTE}; letter-spacing:0.04em; text-transform:uppercase; font-weight:600; width:38%; vertical-align:top;`;
  const valStyle   = `padding:12px 14px; border-bottom:1px solid ${BORDER}; font-size:14px; color:${INK}; vertical-align:top;`;
  const totalLabel = `padding:14px 14px; background:${INK}; color:${GOLD}; font-size:13px; letter-spacing:0.04em; text-transform:uppercase; font-weight:700;`;
  const totalVal   = `padding:14px 14px; background:${INK}; color:#ffffff; font-size:18px; font-weight:700;`;

  return `
    <table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; margin:24px 0; border:1px solid ${BORDER}; border-radius:8px; overflow:hidden;">
      <tr><td style="${labelStyle}">Reference</td><td style="${valStyle}"><strong style="color:${GOLD_DARK};">#${booking.referenceNumber || booking.id?.slice(0, 5)}</strong></td></tr>
      <tr><td style="${labelStyle}">Pickup</td><td style="${valStyle}">${booking.pickupAddress || 'N/A'}</td></tr>
      <tr><td style="${labelStyle}">Dropoff</td><td style="${valStyle}">${booking.dropoffAddress || 'N/A'}</td></tr>
      <tr><td style="${labelStyle}">Date &amp; Time</td><td style="${valStyle}">${booking.date || 'N/A'} at <strong>${formatTime12(booking.time)}</strong></td></tr>
      <tr><td style="${labelStyle}">Passengers</td><td style="${valStyle}">${booking.passengers || 1}</td></tr>
      ${flightNum ? `<tr><td style="${labelStyle}">Flight</td><td style="${valStyle}">${flightNum}</td></tr>` : ''}
      ${booking.bookReturn && booking.returnDate ? `
        <tr><td style="${labelStyle}">Return Date &amp; Time</td><td style="${valStyle}">${booking.returnDate} at <strong>${formatTime12(booking.returnTime)}</strong></td></tr>
        ${returnFlightNum ? `<tr><td style="${labelStyle}">Return Flight</td><td style="${valStyle}">${returnFlightNum}</td></tr>` : ''}
      ` : ''}
      <tr><td style="${totalLabel}">Total</td><td style="${totalVal}">$${formatPrice(booking.pricing?.totalPrice || booking.totalPrice)} NZD</td></tr>
    </table>
  `;
}

function emailWrapper(innerHtml, preheader = '') {
  return `
    <div style="background:#f4f4f4; padding:24px 0; font-family:Arial,Helvetica,sans-serif;">
      ${preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${preheader}</div>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <!-- Header band -->
        <tr>
          <td style="background:${INK}; padding:24px 32px; border-bottom:3px solid ${GOLD};">
            <p style="margin:0; font-family:Georgia,serif; font-size:24px; color:${GOLD}; letter-spacing:0.04em; font-weight:700;">BookARide</p>
            <p style="margin:4px 0 0 0; font-size:11px; color:#bdbdbd; letter-spacing:0.18em; text-transform:uppercase;">Premium Airport Transfers &middot; New Zealand</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px; color:${INK}; font-size:15px; line-height:1.6;">
            ${innerHtml}
          </td>
        </tr>
        <!-- Footer band -->
        <tr>
          <td style="background:${CREAM}; padding:20px 32px; border-top:1px solid ${BORDER}; text-align:center; font-size:12px; color:${MUTE};">
            <p style="margin:0 0 6px 0; color:${INK}; font-weight:600; letter-spacing:0.04em;">BookARide NZ</p>
            <p style="margin:0;">
              <a href="https://bookaride.co.nz" style="color:${GOLD_DARK}; text-decoration:none; font-weight:600;">bookaride.co.nz</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; text-decoration:none; font-weight:600;">info@bookaride.co.nz</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function gildedHeading(text, accentColour = GOLD_DARK) {
  return `<h2 style="margin:0 0 8px 0; font-family:Georgia,serif; font-size:24px; color:${INK}; font-weight:700; letter-spacing:0.01em;">${text}</h2><div style="height:3px; width:48px; background:${accentColour}; margin:0 0 20px 0; border-radius:2px;"></div>`;
}

function payButton(href, label) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr><td align="center">
        <a href="${href}" style="background:${GOLD}; color:${INK}; padding:16px 44px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px; letter-spacing:0.02em; display:inline-block; border:1px solid ${GOLD_DARK};">${label}</a>
      </td></tr>
    </table>
  `;
}

function noReplyFooter() {
  return `<p style="font-size:12px; color:${MUTE}; margin:28px 0 0 0; padding-top:16px; border-top:1px solid ${BORDER}; line-height:1.6;">Please do not reply to this confirmation — it is sent from an unattended address. For any questions, email <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; font-weight:600; text-decoration:none;">info@bookaride.co.nz</a>.</p>`;
}

function customerBookingReceivedEmail(booking, { requiresApproval = false } = {}) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Thank you for your booking')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">We've received your booking request. ${
      requiresApproval
        ? `<strong style="color:${GOLD_DARK};">Your booking is within 24 hours and requires admin approval — you'll hear from us shortly.</strong>`
        : 'Your booking is being processed.'
    }</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 0 0;"><strong style="color:${INK};">Next step:</strong> Complete your payment using the link you'll receive separately, or click the pay button on your booking confirmation page.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Booking Received - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your booking #${booking.referenceNumber} has been received`),
  };
}

function customerBookingConfirmedEmail(booking) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Payment Successful')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">Your booking is <strong style="color:${GOLD_DARK};">confirmed</strong> and payment received. Your driver will arrive at the scheduled time.</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 0 0;"><strong style="color:${INK};">Payment Status:</strong> <span style="background:${GOLD}; color:${INK}; padding:5px 14px; border-radius:4px; font-weight:700; letter-spacing:0.06em;">PAID</span></p>
    <p style="margin:20px 0 0 0;">Thank you for choosing BookARide. We'll be in touch if anything changes.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Booking Confirmed - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your booking #${booking.referenceNumber} is confirmed`),
  };
}

function customerPayOnPickupEmail(booking) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Booking Confirmed')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">Your booking is <strong style="color:${GOLD_DARK};">confirmed</strong>. Your driver will arrive at the scheduled time.</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 0 0;"><strong style="color:${INK};">Payment:</strong> <span style="background:#fef3c7; color:#92400e; padding:5px 14px; border-radius:4px; font-weight:700; letter-spacing:0.06em;">PAY ON PICKUP</span></p>
    <p style="margin:14px 0 0 0;">Please have payment ready when your driver arrives — cash or card accepted in-vehicle.</p>
    <p style="margin:14px 0 0 0;">Questions? Email <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; font-weight:600;">info@bookaride.co.nz</a>.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Booking Confirmed (Pay on Pickup) - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your booking #${booking.referenceNumber} is confirmed — pay driver at pickup`),
  };
}

function customerBookingApprovedEmail(booking) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Your booking is approved')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">Your BookARide transfer has been <strong style="color:${GOLD_DARK};">approved</strong> by our team. You're all set.</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 0 0;"><strong style="color:${INK};">Next step:</strong> Please complete your payment using the link you received, or contact us at <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; font-weight:600;">info@bookaride.co.nz</a> if you haven't received a payment link.</p>
    <p style="margin:14px 0 0 0;">We'll see you soon.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Booking Approved - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your BookARide booking #${booking.referenceNumber} has been approved`),
  };
}

function customerPaymentLinkEmail(booking, paymentUrl) {
  const name = customerName(booking);
  const amount = formatPrice(booking.pricing?.totalPrice || booking.totalPrice);
  const body = `
    ${gildedHeading('Complete Your Payment')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">Please complete payment for your booking using the secure link below.</p>
    ${bookingDetailsTable(booking)}
    ${payButton(paymentUrl, `Pay $${amount} NZD Securely`)}
    <p style="font-size:12px; color:${MUTE}; margin:0;">Or copy this link into your browser:<br><a href="${paymentUrl}" style="color:${GOLD_DARK}; word-break:break-all;">${paymentUrl}</a></p>
    <p style="font-size:12px; color:${MUTE}; margin:16px 0 0 0;">Your payment is processed securely via Stripe. BookARide never stores your card details.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Complete Your Payment - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Pay $${amount} to confirm your booking`),
  };
}

function adminNewBookingEmail(booking, { requiresApproval = false } = {}) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading(`New Booking #${booking.referenceNumber}`)}
    ${requiresApproval ? `<p style="background:#fee2e2; color:#991b1b; padding:12px 14px; border-radius:6px; font-weight:bold; margin:0 0 14px 0;">Within 24 hours — requires manual approval</p>` : ''}
    <p style="margin:0 0 6px 0;"><strong>Customer:</strong> ${name}</p>
    <p style="margin:0 0 6px 0;"><strong>Email:</strong> ${booking.email || 'N/A'}</p>
    <p style="margin:0 0 6px 0;"><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
    ${bookingDetailsTable(booking)}
    ${payButton('https://bookaride.co.nz/admin/login', 'View in Admin Dashboard')}
  `;
  return {
    subject: requiresApproval
      ? `URGENT: Booking #${booking.referenceNumber} needs approval (within 24hrs)`
      : `New Booking #${booking.referenceNumber} - ${name}`,
    html: emailWrapper(body),
  };
}

function customerReminderEmail(booking) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Reminder: Your Trip Tomorrow')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">Just a reminder that your BookARide transfer is scheduled for <strong style="color:${GOLD_DARK};">tomorrow</strong>. Here are your booking details:</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 8px 0;"><strong style="color:${INK};">Please ensure:</strong></p>
    <ul style="margin:0 0 14px 0; padding-left:22px; color:${INK};">
      <li style="margin-bottom:6px;">You're ready at the pickup address 5 minutes before the scheduled time</li>
      <li style="margin-bottom:6px;">Your flight number is up to date (if this is an airport transfer)</li>
      <li style="margin-bottom:6px;">For anything urgent, contact <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; font-weight:600;">info@bookaride.co.nz</a></li>
    </ul>
    <p style="margin:0;">See you tomorrow.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Reminder: Your BookARide trip tomorrow - Ref #${booking.referenceNumber}`,
    html: emailWrapper(body, `Your BookARide trip is tomorrow`),
  };
}

function customerCancellationEmail(booking) {
  const name = customerName(booking);
  const body = `
    ${gildedHeading('Booking Cancelled', '#dc2626')}
    <p style="margin:0 0 14px 0;">Hi ${name},</p>
    <p style="margin:0 0 14px 0;">We're sorry to let you know that your BookARide transfer has been cancelled.</p>
    ${bookingDetailsTable(booking)}
    <p style="margin:20px 0 8px 0;">If you'd like to rebook or have any questions, please contact us:</p>
    <ul style="margin:0 0 14px 0; padding-left:22px; color:${INK};">
      <li style="margin-bottom:6px;">Email: <a href="mailto:info@bookaride.co.nz" style="color:${GOLD_DARK}; font-weight:600;">info@bookaride.co.nz</a></li>
      <li style="margin-bottom:6px;">Book online: <a href="https://bookaride.co.nz/book-now" style="color:${GOLD_DARK}; font-weight:600;">bookaride.co.nz/book-now</a></li>
    </ul>
    <p style="margin:0;">We apologise for any inconvenience caused.</p>
    ${noReplyFooter()}
  `;
  return {
    subject: `Booking Cancelled - Ref #${booking.referenceNumber} - BookARide`,
    html: emailWrapper(body, `Your BookARide booking #${booking.referenceNumber} has been cancelled`),
  };
}

module.exports = {
  formatPrice,
  formatTime12,
  customerName,
  bookingDetailsTable,
  emailWrapper,
  customerBookingReceivedEmail,
  customerBookingConfirmedEmail,
  customerPayOnPickupEmail,
  customerBookingApprovedEmail,
  customerPaymentLinkEmail,
  adminNewBookingEmail,
  customerReminderEmail,
  customerCancellationEmail,
};
