/**
 * SMS message templates. SMS bodies are kept short so each message
 * fits in a single Twilio segment (160 chars on GSM-7) — multi-segment
 * texts are billed per segment and look messy on older phones.
 */

function refOrId(booking) {
  return booking.referenceNumber || booking.id?.slice(0, 5) || '?';
}

function shortDate(dateStr) {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}`;
  return dateStr;
}

function shortAddress(addr) {
  if (!addr) return '';
  return String(addr).split(',')[0].trim().slice(0, 30);
}

/**
 * Booking received — payment still pending. Customer expects a
 * payment link by email.
 */
function customerBookingReceivedSMS(booking) {
  return `BookARide: Booking #${refOrId(booking)} received for ${shortDate(booking.date)} at ${booking.time}. Check email for confirmation & payment link. Help: info@bookaride.co.nz`;
}

/**
 * Booking confirmed and paid — used by the Stripe webhook and by the
 * "paid on the spot" admin manual booking branch.
 */
function customerBookingConfirmedSMS(booking) {
  const pickup = shortAddress(booking.pickupAddress);
  return `BookARide: Payment confirmed. Booking #${refOrId(booking)} on ${shortDate(booking.date)} at ${booking.time}${pickup ? ` from ${pickup}` : ''}. Help: info@bookaride.co.nz`;
}

/**
 * Booking confirmed but customer pays the driver at pickup. Admin-only
 * payment method — never offered customer-facing.
 */
function customerPayOnPickupSMS(booking) {
  const pickup = shortAddress(booking.pickupAddress);
  return `BookARide: Booking #${refOrId(booking)} confirmed for ${shortDate(booking.date)} at ${booking.time}${pickup ? ` from ${pickup}` : ''}. Pay driver on pickup. Help: info@bookaride.co.nz`;
}

module.exports = {
  customerBookingReceivedSMS,
  customerBookingConfirmedSMS,
  customerPayOnPickupSMS,
};
