# Booking system flow – verification checklist

Use this to confirm emails, calendar sync, and updates work so the customer experience is solid.

---

## 1. Email confirmations (one to admin, one to customer)

### On new booking (customer or admin-created)

| Check | How to verify |
|-------|----------------|
| **Customer gets confirmation** | Create a booking with a real email you control. Check inbox (and spam) for the confirmation (subject like "Booking Confirmation - Ref: #…"). |
| **Admin gets a copy** | Check the inbox for `BOOKINGS_NOTIFICATION_EMAIL` (e.g. bookings@bookaride.co.nz). You should see "New Booking - [Customer name] - [date] - Ref: #…". |
| **Resend works** | In admin dashboard, open a booking and use "Resend confirmation". Customer and/or admin should get the email again (and SMS if enabled). |

### Backend logs to look for

- `Confirmation email sent to … via SMTP` (or Mailgun)
- `Auto-notification sent to … for booking: #…`
- `Queued customer confirmation for booking #…` then `customer confirmation for booking #…` (background task completed)

### If emails don’t arrive

- Confirm `SMTP_USER`, `SMTP_PASS`, `NOREPLY_EMAIL` (and optionally Mailgun) in `backend\.env` or Render env.
- Confirm `BOOKINGS_NOTIFICATION_EMAIL` is set for admin copies.
- Check backend logs for "SMTP credentials not configured" or "Failed to send".

---

## 2. Bookings go to calendar

### On new booking

| Check | How to verify |
|-------|----------------|
| **Outbound trip in calendar** | After creating a booking, open the Google Calendar linked to the backend (`GOOGLE_CALENDAR_ID`). You should see an event for the pickup date/time with customer name and trip details. |
| **Return trip (if applicable)** | For a booking with return date/time, there should be a second calendar event for the return. |
| **Manual sync** | Admin: open a booking → use "Sync to calendar" (or POST `/api/bookings/{id}/sync-calendar`). Event should appear or update. |

### Backend logs to look for

- `Outbound calendar event created: …`
- `Return calendar event created: …` (for return trips)
- `Calendar event(s) created for booking …`

### If calendar doesn’t update

- Backend needs Google Calendar credentials (service account or OAuth): `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_FILE`, and `GOOGLE_CALENDAR_ID` if not using `primary`.
- Check logs for "Cannot create calendar event: No credentials" or calendar API errors.

---

## 3. When you change a booking, the calendar updates

### After editing a booking

| Check | How to verify |
|-------|----------------|
| **Date/time/address change** | In admin, edit a booking and change date, time, return date/time, or pickup/dropoff address. Save. |
| **Calendar reflects change** | In Google Calendar, the event(s) for that booking should show the new date/time and details (backend deletes old events and creates new ones). |
| **Booking with no event yet** | If a booking never got a calendar event (e.g. calendar was down at creation), editing date/time or addresses should still create the event now. |

### Backend logs to look for

- `Calendar event synced for booking …`
- `Deleted calendar event … for update` then `Calendar event(s) created for booking …`

---

## 4. Other customer-experience checks

| Area | What to check |
|------|----------------|
| **Notification preference** | Create a booking with "Email only" or "SMS only". Confirm only that channel is used (email vs SMS). |
| **SMS confirmation** | If Twilio is configured and customer chose SMS or "both", customer should get a confirmation SMS. |
| **Confirmation status in admin** | After sending, the booking should show confirmation sent (and resend available if needed). |
| **Payment link email** | For Stripe/PayPal, after booking the customer should receive the payment link email (and webhook flow if configured). |
| **Reminders** | If you have day-before or other reminder jobs, run them (or wait for cron) and confirm customers get reminders. |
| **Quick approve from email** | Use the approve/reject link from the admin notification email; booking status should update and (if implemented) customer notified. |
| **Tracking / driver updates** | If drivers are assigned and tracking is used, confirm customer-facing tracking link and driver notifications work. |

---

## 5. Quick test sequence (recommended)

1. **Backend + frontend running** (local or staging), env vars set (SMTP, `BOOKINGS_NOTIFICATION_EMAIL`, calendar credentials).
2. **Create one test booking** (customer form or admin manual booking) with your own email and a future date.
3. **Verify:**  
   - Customer email received.  
   - Admin email received at `BOOKINGS_NOTIFICATION_EMAIL`.  
   - One (or two for return) event(s) on Google Calendar.
4. **Edit the same booking** (change time or address), save.
5. **Verify:** Calendar event(s) updated to match.
6. **Resend confirmation** from admin; confirm email (and SMS if applicable) received again.

---

## 6. Code reference (what runs when)

- **New booking (POST /api/bookings):**  
  Background: admin notification → calendar create → (optional) iCloud contact, Xero invoice → customer confirmation (email/SMS per preference).
- **Manual admin booking:** Same notifications and calendar create when not skipped.
- **Update booking (PATCH /api/bookings/{id}):** If `date`, `time`, `returnDate`, `returnTime`, `pickupAddress`, or `dropoffAddress` changed → `update_calendar_event` (creates if missing, otherwise deletes old + creates new).

If you want automated checks against a running backend, use `scripts/verify_booking_flow.py` (see script header for usage).
