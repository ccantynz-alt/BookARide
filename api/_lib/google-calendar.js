/**
 * Google Calendar integration — creates events for bookings.
 * Uses Google Calendar REST API with service account (JWT auth).
 * No googleapis npm package needed — keeps serverless bundle small.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — JSON string of the service account key
 *   GOOGLE_CALENDAR_ID — Calendar ID (defaults to 'primary')
 */

const crypto = require('crypto');

function base64url(data) {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(serviceAccountJson) {
  const sa = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(sa.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Create a Google Calendar event for a booking.
 * Creates two events if there's a return trip.
 */
async function createCalendarEvent(booking) {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (!serviceAccountJson) {
    console.error('CRITICAL: Cannot create calendar event — GOOGLE_SERVICE_ACCOUNT_JSON not set');
    return false;
  }

  try {
    const accessToken = await getAccessToken(serviceAccountJson);

    const customerName = booking.name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer';
    const refNum = booking.referenceNumber || booking.id?.slice(0, 8) || 'N/A';
    const totalPrice = booking.totalPrice || booking.pricing?.totalPrice || 0;
    const paymentStatus = (booking.payment_status || 'pending').toUpperCase();
    const hasReturn = booking.bookReturn && booking.returnDate && booking.returnTime;
    const dropoffShort = (booking.dropoffAddress || '').split(',')[0];

    // Parse date/time in NZ timezone (UTC+12, +13 during DST)
    const bookingDate = booking.date;
    const bookingTime = booking.time || '00:00';
    const startISO = `${bookingDate}T${bookingTime}:00+12:00`;
    const startMs = new Date(startISO).getTime();
    const endMs = startMs + 2 * 60 * 60 * 1000; // 2 hours

    // Format display date
    const displayDate = new Date(startMs).toLocaleDateString('en-NZ', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland'
    });

    const eventIds = [];

    // ===== OUTBOUND EVENT =====
    const outboundEvent = {
      summary: `${customerName} → ${dropoffShort}${hasReturn ? ' + Return' : ''}`,
      location: booking.pickupAddress,
      description: [
        `BOOKING #${refNum}`,
        '',
        'CUSTOMER',
        customerName,
        booking.phone || 'No phone',
        booking.email || 'No email',
        `${booking.passengers || 1} passenger(s)`,
        '',
        `PICKUP: ${displayDate} at ${bookingTime}`,
        booking.pickupAddress,
        '',
        'DROP-OFF',
        booking.dropoffAddress,
        '',
        'PAYMENT',
        `$${Number(totalPrice).toFixed(2)} NZD — ${paymentStatus}`,
        '',
        booking.notes ? `NOTES: ${booking.notes}` : '',
        hasReturn ? `\nRETURN TRIP: ${booking.returnDate} at ${booking.returnTime}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: new Date(startMs).toISOString(),
        timeZone: 'Pacific/Auckland',
      },
      end: {
        dateTime: new Date(endMs).toISOString(),
        timeZone: 'Pacific/Auckland',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const outboundRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(outboundEvent),
      }
    );

    if (outboundRes.ok) {
      const created = await outboundRes.json();
      eventIds.push(created.id);
      console.log(`Calendar event created for booking #${refNum}: ${created.htmlLink}`);
    } else {
      const errText = await outboundRes.text();
      console.error(`CRITICAL: Calendar event creation failed for #${refNum}: ${outboundRes.status} ${errText}`);
      return false;
    }

    // ===== RETURN EVENT (if applicable) =====
    if (hasReturn) {
      const returnStartISO = `${booking.returnDate}T${booking.returnTime}:00+12:00`;
      const returnStartMs = new Date(returnStartISO).getTime();
      const returnEndMs = returnStartMs + 2 * 60 * 60 * 1000;

      const returnEvent = {
        summary: `${customerName} ← Return from ${dropoffShort}`,
        location: booking.dropoffAddress,
        description: [
          `BOOKING #${refNum} — RETURN`,
          '',
          'CUSTOMER',
          customerName,
          booking.phone || 'No phone',
          booking.email || 'No email',
          '',
          `PICKUP: ${booking.returnDate} at ${booking.returnTime}`,
          `From: ${booking.dropoffAddress}`,
          `To: ${booking.pickupAddress}`,
          '',
          'PAYMENT',
          `$${Number(totalPrice).toFixed(2)} NZD — ${paymentStatus}`,
        ].join('\n'),
        start: {
          dateTime: new Date(returnStartMs).toISOString(),
          timeZone: 'Pacific/Auckland',
        },
        end: {
          dateTime: new Date(returnEndMs).toISOString(),
          timeZone: 'Pacific/Auckland',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 },
            { method: 'popup', minutes: 60 },
          ],
        },
      };

      const returnRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(returnEvent),
        }
      );

      if (returnRes.ok) {
        const created = await returnRes.json();
        eventIds.push(created.id);
        console.log(`Return calendar event created for booking #${refNum}: ${created.htmlLink}`);
      } else {
        const errText = await returnRes.text();
        console.error(`Calendar return event failed for #${refNum}: ${returnRes.status} ${errText}`);
      }
    }

    return eventIds.length > 0 ? eventIds : false;
  } catch (err) {
    console.error(`CRITICAL: Calendar integration error: ${err.message}`);
    return false;
  }
}

module.exports = { createCalendarEvent };
