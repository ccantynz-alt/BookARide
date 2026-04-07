/**
 * GET /api/health/booking-system
 *
 * Comprehensive health check for the booking system. This endpoint
 * verifies every dependency the booking flow needs is working:
 *
 * 1. Database connection (Neon Postgres)
 * 2. Database write/read (insert + read a temporary record)
 * 3. Mailgun configuration
 * 4. Stripe configuration
 * 5. Google Maps API key
 * 6. Email template generation
 * 7. Pricing engine
 *
 * Returns a per-component pass/fail report so you can immediately see
 * which Vercel env var is missing or which integration is broken.
 *
 * Usage:
 *   GET https://bookaride.co.nz/api/health/booking-system
 *
 * No auth required — this is a public diagnostic endpoint. It does
 * NOT expose any secrets, only redacted prefixes (first 8 chars).
 */

const { getDb, insertOne, findOne, deleteOne } = require('../_lib/db');
const { calculatePrice } = require('../_lib/pricing');
const { customerBookingReceivedEmail } = require('../_lib/email-templates');
const { v4: uuidv4 } = require('uuid');

function redact(value) {
  if (!value) return 'NOT SET';
  if (value.length <= 8) return '***';
  return `${value.substring(0, 8)}***`;
}

async function checkDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      return { ok: false, message: 'DATABASE_URL env var is not set on Vercel' };
    }
    const sql = getDb();
    const rows = await sql`SELECT 1 as ok`;
    if (rows[0]?.ok !== 1) {
      return { ok: false, message: 'Database query returned unexpected result' };
    }
    return { ok: true, message: 'Connected to Neon Postgres' };
  } catch (err) {
    return { ok: false, message: `Database connection failed: ${err.message}` };
  }
}

async function checkDatabaseWrite() {
  // Insert a fake booking, read it back, then delete it.
  // This proves the bookings table schema is compatible with our code.
  const testId = `health-check-${uuidv4()}`;
  try {
    const testDoc = {
      id: testId,
      _health_check: true,
      createdAt: new Date().toISOString(),
    };
    const inserted = await insertOne('bookings', testDoc);
    if (!inserted.acknowledged) {
      return { ok: false, message: 'insertOne returned not acknowledged' };
    }
    const fetched = await findOne('bookings', { id: testId });
    if (!fetched) {
      return { ok: false, message: 'Inserted but could not read back — table schema may not match code' };
    }
    await deleteOne('bookings', { id: testId });
    return { ok: true, message: 'bookings table accepts insert + read + delete' };
  } catch (err) {
    // Try to clean up
    try { await deleteOne('bookings', { id: testId }); } catch {}
    return { ok: false, message: `Database write test failed: ${err.message}` };
  }
}

function checkMailgun() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey) {
    return { ok: false, message: 'MAILGUN_API_KEY not set — customers will NOT receive confirmation emails' };
  }
  if (!domain) {
    return {
      ok: true,
      warning: 'MAILGUN_DOMAIN not set — using default mg.bookaride.co.nz. Set this if your verified domain is different.',
      message: `MAILGUN_API_KEY set (${redact(apiKey)})`,
    };
  }
  return {
    ok: true,
    message: `MAILGUN_API_KEY set, domain=${domain}`,
  };
}

function checkStripe() {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  const webhook = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) {
    return { ok: false, message: 'STRIPE_SECRET_KEY not set — customers cannot pay' };
  }
  if (!key.startsWith('sk_')) {
    return { ok: false, message: 'STRIPE_SECRET_KEY does not start with sk_ — likely the publishable key by mistake' };
  }
  if (!webhook) {
    return {
      ok: true,
      warning: 'STRIPE_WEBHOOK_SECRET not set — webhook signature verification disabled (insecure)',
      message: `Stripe key set (${redact(key)})`,
    };
  }
  return {
    ok: true,
    message: `Stripe key (${redact(key)}) and webhook secret (${redact(webhook)}) both set`,
  };
}

function checkGoogleMaps() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return {
      ok: false,
      message: 'GOOGLE_MAPS_API_KEY not set — address autocomplete and distance calculation will not work',
    };
  }
  return { ok: true, message: `Google Maps key set (${redact(key)})` };
}

function checkPricingEngine() {
  try {
    const result = calculatePrice({
      distanceKm: 25,
      pickupAddress: '123 Test St, Auckland',
      dropoffAddress: 'Auckland Airport',
      passengers: 2,
      bookReturn: false,
      vipAirportPickup: false,
      oversizedLuggage: false,
    });
    if (typeof result.totalPrice !== 'number' || result.totalPrice <= 0) {
      return { ok: false, message: 'Pricing engine returned invalid totalPrice' };
    }
    return { ok: true, message: `Pricing engine returns valid quote ($${result.totalPrice} for 25km test trip)` };
  } catch (err) {
    return { ok: false, message: `Pricing engine threw: ${err.message}` };
  }
}

function checkEmailTemplate() {
  try {
    const fakeBooking = {
      id: 'health-check',
      referenceNumber: '999',
      name: 'Health Check',
      email: 'test@example.com',
      phone: '021 000 0000',
      pickupAddress: '123 Test St',
      dropoffAddress: 'Auckland Airport',
      date: '2026-12-25',
      time: '10:00',
      passengers: 2,
      pricing: { totalPrice: 150 },
    };
    const tpl = customerBookingReceivedEmail(fakeBooking);
    if (!tpl.subject || !tpl.html) {
      return { ok: false, message: 'Email template returned missing fields' };
    }
    if (!tpl.html.includes('Health Check')) {
      return { ok: false, message: 'Email template did not interpolate name correctly' };
    }
    return { ok: true, message: 'Email templates render correctly' };
  } catch (err) {
    return { ok: false, message: `Email template threw: ${err.message}` };
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  const checks = {
    database_connection: await checkDatabase(),
    database_write: { ok: false, message: 'Skipped (no DB connection)' },
    mailgun: checkMailgun(),
    stripe: checkStripe(),
    google_maps: checkGoogleMaps(),
    pricing_engine: checkPricingEngine(),
    email_template: checkEmailTemplate(),
  };

  // Only run write test if connection works
  if (checks.database_connection.ok) {
    checks.database_write = await checkDatabaseWrite();
  }

  // Critical checks that block bookings entirely
  const criticalChecks = ['database_connection', 'database_write', 'pricing_engine', 'email_template'];
  const blockingFailures = criticalChecks.filter(k => !checks[k].ok);

  // Important but non-blocking
  const importantChecks = ['mailgun', 'stripe', 'google_maps'];
  const warnings = importantChecks.filter(k => !checks[k].ok);

  const status = blockingFailures.length === 0 ? 'healthy' : 'broken';

  return res.status(blockingFailures.length === 0 ? 200 : 500).json({
    status,
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
    summary: blockingFailures.length === 0
      ? (warnings.length === 0
          ? 'BOOKING SYSTEM FULLY OPERATIONAL — all checks pass'
          : `Booking system works but ${warnings.length} non-critical service(s) need attention: ${warnings.join(', ')}`)
      : `BOOKING SYSTEM BROKEN — ${blockingFailures.length} critical failure(s): ${blockingFailures.join(', ')}`,
    checks,
    blocking_failures: blockingFailures,
    warnings,
    next_steps: blockingFailures.length > 0
      ? 'Set the missing env vars in Vercel > Settings > Environment Variables, then redeploy.'
      : warnings.length > 0
        ? 'The booking system works but some integrations are missing. Set the warning env vars in Vercel for full functionality.'
        : 'All systems operational. Test by making a real booking.',
  });
};
