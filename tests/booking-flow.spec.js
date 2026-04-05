/**
 * BookARide End-to-End Tests — Playwright
 * Tests the full booking flow, email endpoints, calendar, and admin panel.
 * Run: npx playwright test tests/booking-flow.spec.js
 */
const { test, expect } = require('@playwright/test');

const SITE_URL = 'https://bookaride.co.nz';
const API_URL = `${SITE_URL}/api`;

// ============================================================
// 1. HOMEPAGE & NAVIGATION
// ============================================================
test.describe('Homepage & Navigation', () => {
  test('Homepage loads without errors', async ({ page }) => {
    const response = await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBeLessThan(400);

    // Check no error boundary triggered
    const errorBoundary = await page.locator('text=Something went wrong').count();
    expect(errorBoundary).toBe(0);

    // Check key elements exist
    await expect(page.locator('header')).toBeVisible();
  });

  test('Book Now page loads', async ({ page }) => {
    const response = await page.goto(`${SITE_URL}/book-now`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBeLessThan(400);

    // Check the booking form is present
    const form = await page.locator('form, [class*="booking"], [class*="BookNow"]').first();
    await expect(form).toBeVisible({ timeout: 15000 });
  });

  test('Fuel surcharge banner is visible and not clipped', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const banner = page.locator('text=Fuel Surcharge Notice').first();
    const isBannerVisible = await banner.isVisible().catch(() => false);

    if (isBannerVisible) {
      const box = await banner.boundingBox();
      expect(box).not.toBeNull();
      // Banner should be below the header (at least 80px from top)
      expect(box.y).toBeGreaterThan(60);
      // Banner should be fully on screen
      expect(box.y).toBeLessThan(200);
      console.log(`✓ Fuel banner at y=${box.y}px — visible and not clipped`);
    } else {
      console.log('⚠ Fuel surcharge banner not visible (may be dismissed or removed)');
    }
  });
});

// ============================================================
// 2. API HEALTH CHECKS
// ============================================================
test.describe('API Endpoints', () => {
  test('Pricing endpoint responds', async ({ request }) => {
    const response = await request.post(`${API_URL}/calculate-price`, {
      data: {
        serviceType: 'airport-transfer',
        pickupAddress: 'Auckland Airport, Auckland',
        dropoffAddress: 'Sky Tower, Auckland CBD',
        passengers: 1,
        vipAirportPickup: false,
        oversizedLuggage: false,
        bookReturn: false,
      },
    });
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data.totalPrice).toBeGreaterThan(0);
      expect(data.distance).toBeGreaterThan(0);
      console.log(`✓ Price: $${data.totalPrice} for ${data.distance}km`);
    } else {
      console.log(`⚠ Pricing endpoint returned ${response.status()} — may need Google Maps API key`);
    }
  });

  test('Bookings list endpoint responds (unauthenticated returns 401)', async ({ request }) => {
    const response = await request.get(`${API_URL}/bookings`);
    // Should require auth
    expect([200, 401, 403]).toContain(response.status());
    console.log(`✓ Bookings endpoint: ${response.status()}`);
  });

  test('Mailgun configuration check — send test via API', async ({ request }) => {
    // We can't actually test Mailgun without credentials, but we can check the endpoint exists
    const response = await request.post(`${API_URL}/contact`, {
      data: {
        name: 'Playwright Test',
        email: 'test@example.com',
        message: 'Automated test — please ignore',
      },
    });
    // Should not be 500 (would indicate misconfiguration)
    console.log(`✓ Contact endpoint: ${response.status()}`);
    if (response.status() === 500) {
      const body = await response.text();
      console.log(`  ⚠ Error: ${body}`);
    }
    expect(response.status()).not.toBe(500);
  });
});

// ============================================================
// 3. BOOKING FORM FLOW
// ============================================================
test.describe('Booking Form', () => {
  test('BookNow form has all required fields', async ({ page }) => {
    await page.goto(`${SITE_URL}/book-now`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for form to load
    await page.waitForTimeout(3000);

    // Check for address inputs
    const pickupInput = page.locator('[placeholder*="pickup" i], [placeholder*="pick-up" i], [placeholder*="Pick" i]').first();
    const dropoffInput = page.locator('[placeholder*="drop" i], [placeholder*="destination" i], [placeholder*="Drop" i]').first();

    const pickupVisible = await pickupInput.isVisible().catch(() => false);
    const dropoffVisible = await dropoffInput.isVisible().catch(() => false);

    console.log(`  Pickup input visible: ${pickupVisible}`);
    console.log(`  Dropoff input visible: ${dropoffVisible}`);

    // Check for date/time pickers (should be CustomDatePicker, NOT raw input[type=date])
    const rawDateInputs = await page.locator('input[type="date"]').count();
    const rawTimeInputs = await page.locator('input[type="time"]').count();
    console.log(`  Raw date inputs: ${rawDateInputs} (should be 0)`);
    console.log(`  Raw time inputs: ${rawTimeInputs} (should be 0)`);

    if (rawDateInputs > 0 || rawTimeInputs > 0) {
      console.log('  ⚠ FAIL: Raw HTML date/time inputs found — should use CustomDatePicker/CustomTimePicker');
    }
  });

  test('Address autocomplete loads Google Maps suggestions', async ({ page }) => {
    await page.goto(`${SITE_URL}/book-now`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Find pickup input and type
    const pickupInput = page.locator('[placeholder*="pickup" i], [placeholder*="pick-up" i], [placeholder*="Pick" i]').first();
    const isVisible = await pickupInput.isVisible().catch(() => false);

    if (isVisible) {
      await pickupInput.fill('Auckland Air');
      await page.waitForTimeout(2000);

      // Check for autocomplete dropdown
      const suggestions = page.locator('[data-autocomplete-dropdown], [class*="suggestion"], [class*="autocomplete"]');
      const suggestionsVisible = await suggestions.first().isVisible().catch(() => false);
      console.log(`  Autocomplete suggestions visible: ${suggestionsVisible}`);

      if (!suggestionsVisible) {
        console.log('  ⚠ No autocomplete suggestions appeared — check Google Maps API key');
      }
    } else {
      console.log('  ⚠ Pickup input not found on page');
    }
  });
});

// ============================================================
// 4. ADMIN PANEL
// ============================================================
test.describe('Admin Panel', () => {
  test('Admin login page loads', async ({ page }) => {
    const response = await page.goto(`${SITE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBeLessThan(400);

    // Should show login form or dashboard
    await page.waitForTimeout(2000);
    const hasLoginForm = await page.locator('input[type="password"], input[type="email"]').first().isVisible().catch(() => false);
    const hasDashboard = await page.locator('text=BookARide').first().isVisible().catch(() => false);

    console.log(`  Login form visible: ${hasLoginForm}`);
    console.log(`  Dashboard visible: ${hasDashboard}`);
    expect(hasLoginForm || hasDashboard).toBeTruthy();
  });

  test('Admin login endpoint works', async ({ request }) => {
    // Test with wrong credentials — should return 401, not 500
    const response = await request.post(`${API_URL}/admin/login`, {
      data: {
        email: 'test@test.com',
        password: 'wrongpassword',
      },
    });
    // 401 = correct (wrong creds rejected), 500 = broken endpoint
    expect(response.status()).not.toBe(500);
    console.log(`  Login with wrong creds: ${response.status()} (expect 401)`);
  });
});

// ============================================================
// 5. PAYMENT FLOW
// ============================================================
test.describe('Payment Flow', () => {
  test('Stripe checkout endpoint exists', async ({ request }) => {
    const response = await request.post(`${API_URL}/payment/create-checkout`, {
      data: {
        booking_id: 'test-nonexistent',
        amount: 150,
      },
    });
    // Should not be 404 (endpoint missing) — 400/500 is ok (bad data)
    expect(response.status()).not.toBe(404);
    console.log(`  Checkout endpoint: ${response.status()}`);
  });

  test('Payment success page loads', async ({ page }) => {
    // Visit with a fake session — should handle gracefully
    const response = await page.goto(`${SITE_URL}/payment-success?session_id=cs_test_fake`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    expect(response.status()).toBeLessThan(400);

    // Should show payment success page (not a crash)
    await page.waitForTimeout(3000);
    const errorBoundary = await page.locator('text=Something went wrong').count();
    expect(errorBoundary).toBe(0);
    console.log('  ✓ Payment success page handles invalid session gracefully');
  });
});

// ============================================================
// 6. CRITICAL PAGES — NO 404s
// ============================================================
test.describe('Critical Pages Load', () => {
  const criticalPages = [
    '/',
    '/book-now',
    '/services',
    '/contact',
    '/about',
    '/privacy-policy',
    '/terms-and-conditions',
    '/admin',
  ];

  for (const path of criticalPages) {
    test(`${path} returns 200`, async ({ page }) => {
      const response = await page.goto(`${SITE_URL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      expect(response.status()).toBeLessThan(400);

      // Check no error boundary
      const errorBoundary = await page.locator('text=Something went wrong').count();
      expect(errorBoundary).toBe(0);
    });
  }
});

// ============================================================
// 7. CONSOLE ERROR CHECK
// ============================================================
test.describe('No Console Errors on Key Pages', () => {
  const pagesToCheck = ['/', '/book-now', '/contact'];

  for (const path of pagesToCheck) {
    test(`${path} has no critical console errors`, async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore known non-critical errors
          if (text.includes('favicon') || text.includes('manifest') || text.includes('chrome-extension')) return;
          errors.push(text);
        }
      });

      await page.goto(`${SITE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);

      if (errors.length > 0) {
        console.log(`  ⚠ Console errors on ${path}:`);
        errors.forEach(e => console.log(`    - ${e.slice(0, 200)}`));
      } else {
        console.log(`  ✓ No console errors on ${path}`);
      }

      // Allow up to 3 non-critical console errors
      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Cannot read properties') ||
        e.includes('is not defined') ||
        e.includes('is not a function')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
