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

### 6. Booking Form: LOCKED Structure

The booking form structure is FINAL. Do not restructure, split, or duplicate sections.

- **Customer form**: `frontend/src/pages/BookNow.jsx`
- **Admin create**: `frontend/src/components/admin/CreateBookingModal.jsx`
- **Admin edit**: `frontend/src/components/admin/EditBookingModal.jsx`
- The form has ONE unified "Flight Details" section containing both departure flight info and return journey (date, time, return flight number)
- The return fields (`returnDate`, `returnTime`, `returnFlightNumber`) are linked to the admin Return Trip Departure Monitor (`UrgentReturnsPanel.jsx`) and return alert notifications
- **NEVER** split flight details and return journey into separate sections
- **NEVER** add a second/duplicate flight details section
- **NEVER** remove or rename the return journey fields (`returnDate`, `returnTime`, `returnFlightNumber`) — they power return notifications
- **NEVER** change the booking form layout without explicit permission

### 7. No Shuttle Bookings in Admin Panel

Shuttle bookings (`db.shuttle_bookings`) are NOT displayed in the admin booking list.

- The admin panel `GET /api/bookings` returns **ONLY** from `db.bookings` collection
- **NEVER** merge shuttle_bookings into the admin booking list
- **NEVER** add shuttle booking fetch/normalization code to `GET /api/bookings`
- **NEVER** include shuttle counts in booking count endpoints
- The `SharedShuttle.jsx` page and shuttle endpoints can still exist for public use, but shuttle data does NOT appear in admin booking management

### 8. Admin Panel: Do NOT Add Features Without Permission

The admin dashboard is production-critical. Do not add tabs, panels, modals, or features to it without explicit permission from the user.

- **NEVER** add new tabs to the admin dashboard without asking first
- **NEVER** restructure the booking list view or change how bookings are displayed
- **NEVER** add third-party integrations to the admin panel without permission
- **NEVER** hide or filter bookings in a way that makes paid bookings invisible
- Every booking in `db.bookings` MUST appear in the admin panel — no silent dropping

### 9. Booking Validation: NEVER Silently Drop Bookings

When fetching bookings for the admin panel, Pydantic validation failures must NOT cause bookings to be hidden.

- If a booking fails `Booking(**b)` validation, use `Booking.model_construct(**b)` as fallback
- **NEVER** use a try/except that silently skips bookings the admin needs to see
- A booking with payment_status="paid" must ALWAYS be visible regardless of validation errors
- Log warnings for validation issues but always show the booking

---

## PRE-CHANGE CHECKLIST

Before making ANY change, verify:

1. Does my change introduce MongoDB, Motor, or pymongo? **STOP.**
2. Does my change introduce SendGrid, SMTP, or smtplib? **STOP.**
3. Does my change add a new import? **Verify the component/module exists first.**
4. Does my change remove or modify an existing import? **Verify nothing else uses it.**
5. Am I adding a new JSX component usage? **Add the import statement too.**
6. Does my build pass with `cd frontend && npm run build`? **Test before committing.**
7. Does my change add shuttle bookings to the admin panel? **STOP.**
8. Does my change hide any bookings from the admin panel? **STOP.**
9. Am I adding a new feature to the admin dashboard? **ASK THE USER FIRST.**

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
| Maps       | Google Maps API + Geoapify        | via env vars       |

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
- `GEOAPIFY_API_KEY`
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
