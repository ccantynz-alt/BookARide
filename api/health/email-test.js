/**
 * GET /api/health/email-test?to=<email>
 *
 * Admin-only diagnostic that fires a real test email through the email provider.
 * Use this when /api/health/booking-system passes but customers still
 * report missing booking confirmations — it proves whether mail
 * actually leaves the platform end-to-end.
 *
 * Sends a small confirmation-style template (renders the same
 * customerBookingReceivedEmail template we use in production) to the
 * supplied address. Returns the send outcome on success so you
 * can correlate with the Vapron dashboard logs.
 *
 * Auth: requires Bearer admin JWT in Authorization header. We do NOT
 * leave this open because anyone could otherwise burn through email
 * quota or use it as a spam relay.
 */
const jwt = require('jsonwebtoken');
const { findOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/email');
const { customerBookingReceivedEmail, adminNewBookingEmail } = require('../_lib/email-templates');

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, detail: 'Admin authentication required (Bearer token)' };
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    return { ok: false, status: 500, detail: 'JWT_SECRET_KEY not set on server' };
  }
  try {
    const payload = jwt.verify(token, secret);
    const admin = await findOne('admin_users', { username: payload.sub });
    if (!admin) return { ok: false, status: 401, detail: 'Admin user not found' };
    if (admin.is_active === false) return { ok: false, status: 401, detail: 'Admin disabled' };
    return { ok: true, admin };
  } catch {
    return { ok: false, status: 401, detail: 'Invalid or expired admin token' };
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ detail: auth.detail });

  const to = (req.query?.to || req.body?.to || '').trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({
      detail: 'Pass ?to=<valid-email-address> in the query string',
    });
  }

  const fakeBooking = {
    id: 'email-test',
    referenceNumber: `TEST-${Date.now().toString().slice(-5)}`,
    name: 'Email Test',
    email: to,
    phone: '021 000 0000',
    pickupAddress: '123 Health-Check St, Auckland',
    dropoffAddress: 'Auckland Airport',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    passengers: 1,
    pricing: { totalPrice: 150 },
  };

  const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';

  const customerTpl = customerBookingReceivedEmail(fakeBooking);
  const adminTpl = adminNewBookingEmail(fakeBooking);

  const [customerResult, adminResult] = await Promise.allSettled([
    sendEmail({
      to,
      subject: `[TEST - CUSTOMER COPY] ${customerTpl.subject}`,
      html: customerTpl.html,
      replyTo: 'info@bookaride.co.nz',
    }),
    sendEmail({
      to: adminEmail,
      subject: `[TEST - ADMIN COPY] ${adminTpl.subject}`,
      html: adminTpl.html,
    }),
  ]);

  const customerSent = customerResult.status === 'fulfilled' && customerResult.value === true;
  const adminSent = adminResult.status === 'fulfilled' && adminResult.value === true;

  return res.status(customerSent && adminSent ? 200 : 500).json({
    status: customerSent && adminSent ? 'ok' : 'broken',
    summary: customerSent && adminSent
      ? `Test emails accepted by the email provider for ${to} (customer template) and ${adminEmail} (admin template). Check inboxes + spam.`
      : 'The email provider rejected one or both test emails — see Vercel function logs for the exact response.',
    customer: {
      to,
      sent: customerSent,
      template: 'customerBookingReceivedEmail',
    },
    admin: {
      to: adminEmail,
      sent: adminSent,
      template: 'adminNewBookingEmail',
    },
    triggered_by: auth.admin.username,
    next_steps: customerSent && adminSent
      ? 'If the test landed but real bookings do not, check that booking creation actually calls sendEmail (look for "Booking #N created and verified" then "Customer confirmation email sent" in Vercel logs).'
      : 'Run /api/health/booking-system to see whether the email provider is rejecting the VAPRON_API_KEY.',
  });
};
