# BookARide NZ — Agent Instructions

**READ THIS BEFORE MAKING ANY CHANGES.**

## Critical Rules — DO NOT VIOLATE

1. **Database: Neon PostgreSQL ONLY** — We do NOT use MongoDB, Motor, or pymongo.
   - Connection: `DATABASE_URL` env var (Neon PostgreSQL)
   - Compatibility layer: `backend/database.py` (NeonDatabase class — mimics Motor API)
   - Schema: `backend/schema.sql`
   - NEVER add `motor`, `pymongo`, `MongoClient`, or `MONGO_URL` references
   - NEVER fall back to `mongodb://localhost:27017`

2. **Email: Mailgun ONLY** — We do NOT use SendGrid or SMTP.
   - Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars
   - Sender module: `backend/email_sender.py` (Mailgun only)
   - NEVER add SendGrid, SMTP, or `smtplib` code

3. **Hosting**
   - Frontend: Vercel (React 18, CRA + CRACO)
   - Backend: Render (FastAPI/Uvicorn, Python 3.11+)

## Stack

| Layer      | Tech                              | Location           |
|------------|-----------------------------------|--------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`        |
| Backend    | FastAPI, Uvicorn                  | `backend/`         |
| Database   | Neon PostgreSQL via asyncpg       | `backend/database.py` |
| Email      | Mailgun API                       | `backend/email_sender.py` |
| Payments   | Stripe                            | `backend/stripe_checkout/` |
| SMS        | Twilio                            | via env vars       |
| Maps       | Google Maps API + Geoapify        | via env vars       |

## Backend Architecture

- Main server: `backend/server.py` (~14,000 lines, monolithic)
- Database layer: `backend/database.py` — NeonDatabase class that translates
  MongoDB-style queries (find_one, update_one, etc.) to PostgreSQL JSONB operations
- The `db` global is initialized in the startup event from `DATABASE_URL`
- Route files: `backend/routes_*.py` (bulk, customers, drivers, vehicles, analytics, settings, templates)

## Environment Variables (Render)

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Optional (but needed for full functionality):
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GEOAPIFY_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (Calendar)

## Common Mistakes to Avoid

- DO NOT add MongoDB/Motor dependencies or code — we migrated to Neon
- DO NOT add SendGrid or SMTP email code — we use Mailgun exclusively
- DO NOT use `@vuer-ai/react-helmet-async` — use `react-helmet-async` (official)
- DO NOT reference `MONGO_URL`, `DB_NAME`, or `EMAIL_PROVIDER` env vars
- DO NOT create `.md` documentation files unless explicitly asked
