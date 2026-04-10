/**
 * SMS templates for BookARide customer notifications.
 *
 * Paired with api/_lib/twilio.js. Every template here keeps its body
 * under ~300 chars so Twilio sends in at most 2 segments (160 chars
 * each for GSM-7, 70 for UCS-2). Keep it tight — NZ Twilio costs are
 * per segment and customers hate walls of text.
 *
 * Each function returns a plain string suitable for sendSms({ body }).
 */

function customerName(booking) {
  const first =
    (booking.firstName && booking.firstName.trim()) ||
    (booking.name && booking.name.split(' ')[0]) ||
    '';
  return first || 'there';
}

function refLabel(booking) {
  return booking.referenceNumber || (booking.id ? booking.id.slice(0, 5) : '');
}

/**
 * SMS sent immediately after a booking is created (unpaid).
 * Confirms receipt and reminds them to complete payment.
 */
function bookingReceivedSms(booking, { requiresApproval = false } = {}) {
  const name = customerName(booking);
  const ref = refLabel(booking);
  const when = `${booking.date || ''} ${booking.time || ''}`.trim();

  if (requiresApproval) {
    return (
      `Hi ${name}, BookARide received your booking #${ref} for ${when}. ` +
      `It's within 24hrs so we'll confirm ASAP. Questions? Reply or call 021 743 321.`
    );
  }

  return (
    `Hi ${name}, BookARide received your booking #${ref} for ${when}. ` +
    `Please complete payment via the link in your email to confirm. ` +
    `Questions? Reply or call 021 743 321.`
  );
}

/**
 * SMS sent when payment is confirmed (Stripe webhook).
 */
function bookingConfirmedSms(booking) {
  const name = customerName(booking);
  const ref = refLabel(booking);
  const when = `${booking.date || ''} ${booking.time || ''}`.trim();
  const pickup = (booking.pickupAddress || '').slice(0, 60);

  return (
    `BookARide: Payment received — booking #${ref} CONFIRMED. ` +
    `Hi ${name}, your driver will arrive ${when} at ${pickup}. ` +
    `See you then! Questions? Reply or call 021 743 321.`
  );
}

/**
 * Reminder SMS sent the day before the trip.
 */
function bookingReminderSms(booking) {
  const name = customerName(booking);
  const ref = refLabel(booking);
  const pickup = (booking.pickupAddress || '').slice(0, 60);
  const time = booking.time || '';

  return (
    `BookARide reminder: Hi ${name}, your transfer #${ref} is tomorrow at ${time} ` +
    `from ${pickup}. Please be ready 5 min early. Questions? Reply or call 021 743 321.`
  );
}

module.exports = {
  bookingReceivedSms,
  bookingConfirmedSms,
  bookingReminderSms,
};
