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
