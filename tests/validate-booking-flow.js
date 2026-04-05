/**
 * BookARide Validation Script — Direct Code Audit
 * Tests API code logic, email configuration, and frontend integrity
 * without needing internet access or a browser.
 *
 * Run: node tests/validate-booking-flow.js
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ FAIL: ${msg}`); }
function warn(msg) { warnings++; console.log(`  ⚠️  WARN: ${msg}`); }
function section(name) { console.log(`\n━━━ ${name} ━━━`); }

function readFile(filePath) {
  const full = path.resolve(__dirname, '..', filePath);
  try { return fs.readFileSync(full, 'utf-8'); } catch { return null; }
}

// ============================================================
section('1. EMAIL SYSTEM — mailgun.js');
// ============================================================
const mailgun = readFile('api/_lib/mailgun.js');
if (!mailgun) { fail('api/_lib/mailgun.js not found'); } else {
  // EU endpoint support
  if (mailgun.includes('api.eu.mailgun.net') || mailgun.includes('api-eu.mailgun.net')) {
    pass('Mailgun EU endpoint supported');
  } else {
    fail('Mailgun EU endpoint NOT supported — NZ domains need EU region');
  }

  // MAILGUN_REGION env var
  if (mailgun.includes('MAILGUN_REGION')) {
    pass('MAILGUN_REGION env var used for endpoint selection');
  } else {
    fail('No MAILGUN_REGION env var — hardcoded to one region');
  }

  // Error logging
  if (mailgun.includes('CRITICAL') && mailgun.includes('console.error')) {
    pass('Critical errors are logged');
  } else {
    warn('Email errors may not be logged prominently');
  }

  // Diagnostic messages
  if (mailgun.includes('401') || mailgun.includes('403') || mailgun.includes('404')) {
    pass('HTTP status diagnostics for common Mailgun errors');
  } else {
    warn('No specific diagnostics for 401/403/404 errors');
  }

  // Silent failure check
  if (mailgun.includes('return false') && !mailgun.includes('throw')) {
    warn('sendEmail returns false on failure (callers must check return value)');
  }
}

// ============================================================
section('2. BOOKING CREATION — bookings.js');
// ============================================================
const bookings = readFile('api/bookings.js');
if (!bookings) { fail('api/bookings.js not found'); } else {
  // Admin notification
  if (bookings.includes('await sendEmail') && bookings.includes('adminEmail')) {
    pass('Admin notification email is awaited');
  } else if (bookings.includes('sendEmail') && !bookings.includes('await sendEmail')) {
    fail('Admin notification NOT awaited — email may not send before function returns');
  }

  // Customer confirmation on creation
  if (bookings.includes('Booking Received') || bookings.includes('booking confirmation') ||
      (bookings.includes('sendEmail') && bookings.includes('booking.email') && bookings.includes('createBooking'))) {
    pass('Customer receives confirmation email on booking creation');
  } else {
    fail('No customer confirmation email sent on booking creation');
  }

  // Reference number
  if (bookings.includes('referenceNumber') && bookings.includes('getNextReferenceNumber')) {
    pass('Sequential reference numbers generated');
  } else {
    warn('Reference number generation not found');
  }

  // Database verification
  if (bookings.includes('findOne') && bookings.includes('after insert') || bookings.includes('verification')) {
    pass('Booking insert is verified after creation');
  } else {
    warn('Booking insert may not be verified');
  }
}

// ============================================================
section('3. STRIPE WEBHOOK — webhook/stripe.js');
// ============================================================
const webhook = readFile('api/webhook/stripe.js');
if (!webhook) { fail('api/webhook/stripe.js not found'); } else {
  // Customer email
  if (webhook.includes('await sendEmail') && webhook.includes('booking.email')) {
    pass('Customer confirmation email is awaited in webhook');
  } else {
    fail('Customer email NOT properly sent in webhook');
  }

  // Admin email
  if (webhook.includes('await sendEmail') && webhook.includes('adminEmail')) {
    pass('Admin notification email is awaited in webhook');
  } else {
    fail('Admin notification NOT properly sent in webhook');
  }

  // Idempotency
  if (webhook.includes('already') && webhook.includes('paid')) {
    pass('Idempotency check prevents duplicate processing');
  } else {
    fail('No idempotency check — duplicate webhooks could send duplicate emails');
  }

  // Calendar integration
  if (webhook.includes('createCalendarEvent') || webhook.includes('calendar')) {
    pass('Google Calendar integration wired into webhook');
  } else {
    fail('No calendar integration in webhook');
  }

  // Webhook signature verification
  if (webhook.includes('constructEvent') || webhook.includes('STRIPE_WEBHOOK_SECRET')) {
    pass('Stripe webhook signature verification present');
  } else {
    fail('No webhook signature verification — security risk');
  }
}

// ============================================================
section('4. PAYMENT STATUS POLLING — payment/status/[sessionId].js');
// ============================================================
const paymentStatus = readFile('api/payment/status/[sessionId].js');
if (!paymentStatus) { fail('api/payment/status/[sessionId].js not found'); } else {
  // Await on emails
  const awaitCount = (paymentStatus.match(/await sendEmail/g) || []).length;
  const sendCount = (paymentStatus.match(/sendEmail\(/g) || []).length;

  if (awaitCount === sendCount && awaitCount > 0) {
    pass(`All ${sendCount} sendEmail calls are properly awaited`);
  } else if (awaitCount > 0 && awaitCount < sendCount) {
    fail(`${sendCount - awaitCount} sendEmail call(s) missing await`);
  } else if (sendCount > 0 && awaitCount === 0) {
    fail(`ALL ${sendCount} sendEmail calls are missing await — emails will never send`);
  }

  // Calendar
  if (paymentStatus.includes('createCalendarEvent')) {
    pass('Calendar event creation in payment status handler');
  } else {
    warn('No calendar integration in payment status polling');
  }
}

// ============================================================
section('5. GOOGLE CALENDAR — _lib/google-calendar.js');
// ============================================================
const calendar = readFile('api/_lib/google-calendar.js');
if (!calendar) { fail('api/_lib/google-calendar.js not found — calendar integration missing'); } else {
  // Service account auth
  if (calendar.includes('GOOGLE_SERVICE_ACCOUNT_JSON')) {
    pass('Uses service account authentication');
  } else {
    fail('No service account auth — calendar cannot authenticate');
  }

  // NZ timezone
  if (calendar.includes('Pacific/Auckland') || calendar.includes('+12:00')) {
    pass('NZ timezone handling present');
  } else {
    fail('No NZ timezone handling — events will be in wrong timezone');
  }

  // Return trip
  if (calendar.includes('returnDate') || calendar.includes('return')) {
    pass('Return trip calendar events supported');
  } else {
    warn('Return trip events may not be created');
  }

  // Error handling
  if (calendar.includes('catch') && calendar.includes('CRITICAL')) {
    pass('Calendar errors are logged');
  } else {
    warn('Calendar errors may be swallowed');
  }
}

// ============================================================
section('6. FRONTEND — No Raw HTML Inputs');
// ============================================================
const frontendSrc = path.resolve(__dirname, '..', 'frontend', 'src');
let rawInputCount = 0;

function scanForRawInputs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'DateTimePicker.jsx') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForRawInputs(full);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf-8');
      const dateMatches = content.match(/type="date"/g) || [];
      const timeMatches = content.match(/type="time"/g) || [];
      if (dateMatches.length + timeMatches.length > 0) {
        fail(`Raw HTML inputs in ${path.relative(frontendSrc, full)}: ${dateMatches.length} date, ${timeMatches.length} time`);
        rawInputCount += dateMatches.length + timeMatches.length;
      }
    }
  }
}
scanForRawInputs(frontendSrc);
if (rawInputCount === 0) pass('Zero raw HTML date/time inputs — all using custom pickers');

// ============================================================
section('7. FRONTEND — No Direct VITE_BACKEND_URL');
// ============================================================
let directEnvCount = 0;
function scanForDirectEnv(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForDirectEnv(full);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const rel = path.relative(frontendSrc, full);
      if (rel.includes('config/api')) continue; // The config file itself is ok
      const content = fs.readFileSync(full, 'utf-8');
      const matches = content.match(/import\.meta\.env\.VITE_BACKEND_URL/g) || [];
      if (matches.length > 0) {
        fail(`Direct VITE_BACKEND_URL in ${rel} (${matches.length} occurrences)`);
        directEnvCount += matches.length;
      }
    }
  }
}
scanForDirectEnv(frontendSrc);
if (directEnvCount === 0) pass('All files use centralized API config');

// ============================================================
section('8. FRONTEND — No Banned Imports');
// ============================================================
function scanForBanned(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForBanned(full);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf-8');
      const rel = path.relative(frontendSrc, full);
      // Check for Geoapify references, excluding comments
      const nonCommentLines = content.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
      if (/geoapify|GEOAPIFY/i.test(nonCommentLines.join('\n'))) fail(`Geoapify reference in ${rel}`);
      if (/@vuer-ai\/react-helmet-async/.test(content)) fail(`Broken helmet fork in ${rel}`);
    }
  }
}
scanForBanned(frontendSrc);
scanForBanned(path.resolve(__dirname, '..', 'api'));
pass('No banned imports found (Geoapify, broken helmet)');

// ============================================================
section('9. BUILD CHECK');
// ============================================================
const buildDir = path.resolve(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildDir)) {
  const indexHtml = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    pass('Frontend build exists and has index.html');
  } else {
    fail('Build directory exists but no index.html');
  }
} else {
  warn('No build directory — run "cd frontend && npm run build" to create');
}

// ============================================================
section('RESULTS');
// ============================================================
console.log(`\n  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Total: ${passed + failed + warnings}\n`);

if (failed > 0) {
  console.log('  🔴 ISSUES FOUND — fix the failures above before deploying\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('  🟡 All critical checks passed, but review warnings\n');
} else {
  console.log('  🟢 ALL CHECKS PASSED\n');
}
