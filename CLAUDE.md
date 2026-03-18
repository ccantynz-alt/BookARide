# BookARide NZ — Agent Instructions

**READ THIS ENTIRE FILE BEFORE MAKING ANY CHANGES.**
**EVERY rule here exists because a previous agent broke production by ignoring it.**

---

## LOCKED DECISIONS — DO NOT CHANGE, REVERT, OR "IMPROVE"

These decisions are FINAL. Do not introduce alternatives, fallbacks, or "improvements".

### 1. Database: Neon PostgreSQL ONLY

We migrated FROM MongoDB TO Neon PostgreSQL. This is DONE. Do not touch it.

- Connection: `DATABASE_URL` env var (Neon PostgreSQL connection string)
- Compatibility layer: `backend/database.py` (NeonDatabase class — mimics Motor API over PostgreSQL JSONB)
- Schema: `backend/schema.sql`
- **NEVER** add `motor`, `pymongo`, `MongoClient`, or any MongoDB driver
- **NEVER** reference `MONGO_URL`, `DB_NAME`, or `mongodb://` anything
- **NEVER** fall back to `mongodb://localhost:27017`
- **NEVER** add a "MongoDB fallback" or "MongoDB option"

### 2. Email: Mailgun ONLY

We use Mailgun. Not SendGrid. Not SMTP. Not Gmail. Not "a fallback".

- Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars
- Sender module: `backend/email_sender.py` (Mailgun HTTP API only)
- **NEVER** add SendGrid, `smtplib`, `MIMEMultipart`, `MIMEText`, or SMTP code
- **NEVER** add `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars
- **NEVER** add "email fallback" logic — if Mailgun fails, log the error, that's it

### 3. Helmet: react-helmet-async (official)

- **NEVER** use `@vuer-ai/react-helmet-async` — it's a broken fork

### 4. Frontend: CRA + CRACO (NOT Vite, NOT Next.js)

- Build: `craco build` (NOT `react-scripts build`)
- The `@` alias is configured in `craco.config.js` → resolves to `src/`
- **NEVER** migrate to Vite or Next.js unless explicitly asked

### 5. No Facebook Integration

- Facebook integration was removed (caused production crashes)
- **NEVER** re-add FacebookTab or Facebook API routes
- **NEVER** add `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` references

### 7. No Shared Shuttle Service

The shared shuttle service has been completely removed from the admin system and codebase.

- **NEVER** re-add the shuttle tab to AdminDashboard
- **NEVER** re-add `SharedShuttle.jsx` or `ShuttleDriverPortal.jsx`
- **NEVER** re-add shuttle API endpoints (`/api/shuttle/*`)
- Backend shuttle endpoints and pricing code have been removed from `server.py`
- Note: "airport-shuttle" as a `serviceType` for regular bookings is STILL VALID — that's the core private transfer service, not the shared shuttle

### 8. Customer Confirmation Design — LOCKED

The customer confirmation email design is FINAL and must not change:

- Payment method "stripe" displays as "Credit/Debit Card" (never show "Stripe" to customers)
- Payment status shows as green "PAID" badge when payment_status == 'paid'
- PaymentSuccess.jsx shows "Payment Successful!" with booking details — no Stripe branding
- **NEVER** show "Stripe" text in customer-facing emails or pages
- **NEVER** change the confirmation email layout/design without explicit permission

### 6. Maps & Distance: Google Maps API ONLY (No Geoapify)

We use Google Maps for distance calculation, directions, and autocomplete. Geoapify has been removed.

- Distance: `_get_distance_google()` in `backend/server.py` (Distance Matrix + Directions API)
- Config: `GOOGLE_MAPS_API_KEY` env var
- **NEVER** add Geoapify API calls, `GEOAPIFY_API_KEY`, or `geoapify.com` references
- **NEVER** add Geoapify as a "fallback" for Google Maps
- **NEVER** use Geoapify for address autocomplete or distance calculation

### 7. Pricing Rules — DO NOT CHANGE WITHOUT OWNER APPROVAL

These are the AUTHORITATIVE per-km rates. They match the WordPress pricing plugin (screenshot verified 2026-03-13).
Any agent that changes these rates without explicit owner instruction is breaking production pricing.

**Tiered Per-Kilometer Rates** (bracket-based — entire distance charged at ONE rate):

| From (km) | To (km) | Rate per km (NZD) |
|-----------|---------|-------------------|
| 0.1       | 15.0    | $12.00            |
| 15.0      | 15.8    | $8.00             |
| 15.8      | 16.0    | $6.00             |
| 16.0      | 25.5    | $5.50             |
| 25.5      | 35.0    | $5.00             |
| 35.0      | 50.0    | $4.00             |
| 50.0      | 60.0    | $2.60             |
| 60.0      | 75.0    | $2.47             |
| 75.0      | 100.0   | $2.70             |
| 100.0     | 300.0   | $3.50             |

**Code location**: `backend/server.py` lines 1681-1700 (and duplicated in concert pricing lines 1733-1746)

**Add-on fees**:
- VIP Airport Pickup: $15.00
- Oversized Luggage: $25.00
- Extra Passengers: $5.00 per additional (1st included)

**Minimums**:
- Standard minimum: $150.00 per one-way leg
- Matakana Country Park concert: $550.00 flat return (from Hibiscus Coast)

**Stripe processing fee**: Passed to customer — `(subtotal × 2.9%) + $0.30 NZD`

- **NEVER** change these rates without explicit owner approval
- **NEVER** "simplify" or "optimize" the tier structure
- **NEVER** remove the Stripe fee pass-through to customer

### 8. Shuttle Service — REMOVED (2026-03-13)

The shared shuttle service has been completely removed from both frontend and backend.

- **Backend**: All shuttle endpoints (`/shuttle/*`), models (`ShuttleBookingCreate`), constants (`SHUTTLE_PRICING`, `SHUTTLE_TIMES`) removed from `server.py`
- **Database**: `shuttle_bookings` and `shuttle_runs` tables dropped from `schema.sql`
- **Frontend**: Shuttle tab, state, handlers all removed from `AdminDashboard.jsx`; `FacebookTab.jsx` component deleted
- **Booking list**: `GET /api/bookings` now excludes `serviceType: 'shared-shuttle'` from results
- **Service types**: Changed from `airport-shuttle` to `airport-transfer`
- **NEVER** re-add shuttle service endpoints, models, or UI tabs
- **NEVER** re-add `FacebookTab.jsx` or Facebook integration
- **NEVER** add `Bus` icon import back to AdminDashboard

### 9. Booking System Architecture Rules (2026-03-13)

These rules exist because the admin dashboard was 68,000+ lines with severe performance issues.

**Backend rules**:
- `GET /api/bookings` must ALWAYS exclude shuttle bookings (`serviceType != 'shared-shuttle'`)
- Booking count endpoint uses single query with in-memory counting (not 6 separate DB calls)
- Orphan payment check uses batch `$in` query (not N+1 per-payment lookups)
- Soft-delete has rollback: if `delete_one` fails after `insert_one` to `deleted_bookings`, the insert is rolled back
- **NEVER** load all bookings with `.to_list(None)` without a filter — always exclude shuttle/irrelevant data

**Frontend rules**:
- Action buttons must have `e.stopPropagation()`, `min-w-[36px]`, and `cursor-pointer` for reliable clicking
- **NEVER** re-add the shuttle tab or `Bus` icon to the tabs navigation
- Service type options are: `airport-transfer` and `private-transfer` (NOT `airport-shuttle`)

---

## PRE-CHANGE CHECKLIST

Before making ANY change, verify:

1. Does my change introduce MongoDB, Motor, or pymongo? **STOP.**
2. Does my change introduce SendGrid, SMTP, or smtplib? **STOP.**
3. Does my change introduce Geoapify or `GEOAPIFY_API_KEY`? **STOP.**
4. Does my change add a new import? **Verify the component/module exists first.**
5. Does my change remove or modify an existing import? **Verify nothing else uses it.**
6. Am I adding a new JSX component usage? **Add the import statement too.**
7. Does my build pass with `cd frontend && npm run build`? **Test before committing.**

---

## Stack

| Layer      | Tech                              | Location           |
|------------|-----------------------------------|--------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`        |
| Backend    | FastAPI, Uvicorn, Python 3.11+    | `backend/`         |
| Database   | Neon PostgreSQL via asyncpg       | `backend/database.py` |
| Email      | Mailgun API                       | `backend/email_sender.py` |
| Payments   | Stripe                            | `backend/stripe_checkout/` |
| SMS        | Twilio                            | via env vars       |
| Maps       | Google Maps API                   | via env vars       |

## Hosting

- Frontend: **Vercel** (React 18, CRA + CRACO)
- Backend: **Render** (FastAPI/Uvicorn, Python 3.11+)

## Backend Architecture

- Main server: `backend/server.py` (~14,000 lines, monolithic)
- Database layer: `backend/database.py` — NeonDatabase class that translates
  MongoDB-style queries (find_one, update_one, etc.) to PostgreSQL JSONB operations
- The `db` global is initialized in the startup event from `DATABASE_URL`
- Route files: `backend/routes_*.py` (bulk, customers, drivers, vehicles, analytics, settings, templates)

## Environment Variables (Render)

**All credentials are configured in Render's Environment tab — NOT in a `.env` file in the repo.**
The absence of a `.env` file does NOT mean credentials are missing. Do NOT assume services are unconfigured.
See `backend/.env.example` for the full list of variables (template only — no real secrets).

Required (all set in Render):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Optional (but needed for full functionality, all set in Render):
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (Calendar + Search Console)

## Build & Test

```bash
# Frontend build (MUST use npm run build, not react-scripts directly)
cd frontend && npm run build

# Backend start
cd backend && python3 start.py
```

---

## Booking System Architecture

### Booking Flow (Customer → Admin)

1. Customer submits booking via `BookNow.jsx` → `POST /api/bookings` → creates booking in `db.bookings`
2. If within 24 hours: status = `pending_approval` (requires admin manual approval)
3. If Stripe payment: `POST /api/payment/create-checkout` → Stripe → webhook updates booking to `paid`/`confirmed`
4. Admin sees ALL bookings at `GET /api/bookings` (fetches from `db.bookings` ONLY)

### Orphan Payment Recovery

If a customer pays via Stripe but the booking is missing from admin:
- `GET /api/bookings/orphan-payments` — lists paid Stripe transactions with no matching booking
- `POST /api/bookings/recover-from-payment` — creates a booking from the payment data
- The admin dashboard has a "Check Orphan Payments" button for this

### Known Booking System Issues (Fixed 2026-03-11)

- Pydantic `Booking(**b)` validation was silently dropping bookings with missing/invalid fields
- Shuttle bookings were being merged into admin panel causing confusion
- SMTP code existed in `routes_bulk.py` violating Mailgun-only rule
- Orphaned `validate_booking_date` function at module level (not inside any class)

### Known Booking System Issues (Fixed 2026-03-18)

- `insert_many()` was missing from `database.py` — backup restore would crash with AttributeError
- Stripe webhook did not verify `matched_count` after updating booking — payment could succeed but booking status not update
- iCloud contact sync was not triggered after Stripe payment webhook — only on initial booking creation
- Shared shuttle service tab/code removed from admin dashboard (was cluttering the admin panel)
- ALL delete/archive/restore operations now verify backup insert + find_one before deleting source record
- Bulk delete only removes bookings that were successfully backed up (per-record verification)
- Orphan payment recovery now verifies the recovered booking was actually created

### ZERO BOOKING LOSS RULES — MANDATORY

**A booking must NEVER be lost. These rules are absolute and non-negotiable.**

#### Rule 1: NEVER delete without verified backup

Before deleting a booking from ANY collection, the backup/destination insert MUST be:
1. Verified with `result.acknowledged == True`
2. Double-checked with `find_one()` to confirm the record exists in the destination
3. Only THEN can the source record be deleted

This applies to ALL move operations:
- `delete_booking()` → must verify `deleted_bookings.insert_one()` before `bookings.delete_one()`
- `archive_booking()` → must verify `bookings_archive.insert_one()` before `bookings.delete_one()`
- `restore_booking()` → must verify `bookings.insert_one()` before `deleted_bookings.delete_one()`
- `unarchive_booking()` → must verify `bookings.insert_one()` before `bookings_archive.delete_one()`
- Bulk versions of all the above follow the same pattern per-record

**If the backup/verify fails, ABORT the delete and raise an error. The booking stays where it is.**

#### Rule 2: NEVER silently drop bookings on read

- `GET /api/bookings` uses `model_construct()` (not `Booking(**b)`) to skip validators
- Three-tier fallback ensures every record is returned even if fields are missing/invalid
- **NEVER** switch back to `Booking(**b)` for reading — it silently drops records with missing fields

#### Rule 3: VERIFY all critical inserts

After inserting a booking (creation, recovery, import), verify with `find_one()`:
- `POST /api/bookings` — already has double-check
- `POST /api/bookings/recover-from-payment` — verified after insert
- Import/CSV endpoints — must verify each insert

#### Rule 4: After payment confirmation, trigger ALL 4 actions

Every payment confirmation path (webhook, polling, manual) must call:
1. `send_customer_confirmation(booking)` — email/SMS
2. `send_booking_notification_to_admin(booking)` — admin alert
3. `create_calendar_event(booking)` — Google Calendar
4. `add_contact_to_icloud(booking)` — iCloud contacts (deduped)

#### Rule 5: Log CRITICAL on any booking write failure

Any failed booking database operation must log with `logger.error(f"CRITICAL: ...")` so it can be monitored. Never swallow booking errors silently.

#### Rule 6: Booking collections are sacred

There are 3 booking collections. A booking must ALWAYS exist in exactly one of them:
- `db.bookings` — active bookings (shown in admin dashboard)
- `db.deleted_bookings` — soft-deleted bookings (recoverable)
- `db.bookings_archive` — archived completed bookings (7-year retention)

**NEVER** delete a booking from all three. **NEVER** have a code path where a booking exists in zero collections.

---

## History of Production Breaks (why these rules exist)

| Date       | What broke                          | Root cause                              |
|------------|-------------------------------------|-----------------------------------------|
| 2026-03    | Admin dashboard crash               | FacebookTab used but never imported     |
| 2026-03    | Email sending crash potential        | SMTP fallback used MIMEMultipart/smtplib without importing them |
| Repeated   | Database connection failures         | Agents kept adding MongoDB references   |
| Repeated   | Email failures                       | Agents kept adding SendGrid/SMTP code   |
| 2026-03    | Duplicate flight sections in form    | Two separate flight detail sections confused customers |
| 2026-03-11 | Paid booking invisible in admin      | Pydantic validation silently dropped bookings with missing fields |
| 2026-03-11 | Admin panel cluttered/confusing      | Shuttle bookings merged into booking list without permission |
| 2026-03-11 | Bulk email broken                    | SMTP code in routes_bulk.py instead of Mailgun |
| 2026-03-13 | Shuttle polluting admin bookings      | Shuttle bookings mixed into main list; 68K line monolith |
| 2026-03-13 | Buttons unresponsive in admin         | Missing click targets, no stopPropagation on action buttons |
| 2026-03-13 | Orewa booking overcharged ($185)      | Google Maps API failed, 75km fallback used instead of 57.6km actual |
