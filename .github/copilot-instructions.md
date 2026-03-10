# Copilot Instructions for BookARide NZ

## Project Overview

BookARide NZ is a full-stack airport shuttle / private transfer booking platform serving New Zealand.

- **Backend**: FastAPI (Python 3.11+), monolithic `backend/server.py` (~14,000 lines)
- **Frontend**: React 18 (CRA + CRACO), Tailwind CSS, located in `frontend/`
- **Database**: Neon PostgreSQL (NOT MongoDB — fully migrated)
- **Email**: Mailgun only (NOT SendGrid, NOT SMTP)
- **Payments**: Stripe
- **SMS**: Twilio
- **Maps**: Google Maps API (NOT Geoapify)
- **Hosting**: Frontend on Vercel, Backend on Render

## LOCKED DECISIONS — DO NOT CHANGE

These technology choices are final. Do not introduce alternatives, fallbacks, or "improvements".

### Database: Neon PostgreSQL ONLY
- Connection via `DATABASE_URL` env var
- Compatibility layer: `backend/database.py` (NeonDatabase class — mimics Motor API over PostgreSQL JSONB)
- Schema: `backend/schema.sql`
- **NEVER** add `motor`, `pymongo`, `MongoClient`, or any MongoDB driver
- **NEVER** reference `MONGO_URL`, `DB_NAME`, or `mongodb://` anything

### Email: Mailgun ONLY
- Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars
- Sender module: `backend/email_sender.py` (Mailgun HTTP API only)
- **NEVER** add SendGrid, `smtplib`, `MIMEMultipart`, `MIMEText`, or SMTP code
- **NEVER** add `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars

### Frontend: CRA + CRACO (NOT Vite, NOT Next.js)
- Build: `craco build` (NOT `react-scripts build`)
- The `@` alias is configured in `craco.config.js` → resolves to `src/`
- Helmet: Use `react-helmet-async` (official). NEVER use `@vuer-ai/react-helmet-async`.
- **NEVER** migrate to Vite or Next.js unless explicitly asked

### Maps: Google Maps API ONLY (No Geoapify)
- Distance: `_get_distance_google()` in `backend/server.py`
- Config: `GOOGLE_MAPS_API_KEY` env var
- **NEVER** add Geoapify API calls, `GEOAPIFY_API_KEY`, or `geoapify.com` references

### No Facebook Integration
- Facebook integration was removed (caused production crashes)
- **NEVER** re-add FacebookTab or Facebook API routes
- **NEVER** add `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` references

## Pre-Change Checklist

Before making ANY change, verify:

1. Does my change introduce MongoDB, Motor, or pymongo? **STOP.**
2. Does my change introduce SendGrid, SMTP, or smtplib? **STOP.**
3. Does my change introduce Geoapify or `GEOAPIFY_API_KEY`? **STOP.**
4. Does my change add a new import? **Verify the component/module exists first.**
5. Does my change remove or modify an existing import? **Verify nothing else uses it.**
6. Am I adding a new JSX component usage? **Add the import statement too.**
7. Does my build pass with `cd frontend && npm run build`? **Test before committing.**

## Architecture

| Layer      | Tech                              | Location                  |
|------------|-----------------------------------|---------------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`               |
| Backend    | FastAPI, Uvicorn, Python 3.11+    | `backend/`                |
| Database   | Neon PostgreSQL via asyncpg       | `backend/database.py`     |
| Email      | Mailgun API                       | `backend/email_sender.py` |
| Payments   | Stripe                            | `backend/stripe_checkout/`|
| SMS        | Twilio                            | via env vars              |
| Maps       | Google Maps API                   | via env vars              |

### Backend Structure
- Main server: `backend/server.py` (~14,000 lines, monolithic)
- Database layer: `backend/database.py` — NeonDatabase class translating MongoDB-style queries to PostgreSQL JSONB
- The `db` global is initialized in the startup event from `DATABASE_URL`
- Route files: `backend/routes_*.py` (bulk, customers, drivers, vehicles, analytics, settings, templates)

## Services

| Service     | Command                          | Port  | Notes                    |
|-------------|----------------------------------|-------|--------------------------|
| **Backend** | `cd backend && python3 start.py` | 10000 | FastAPI/Uvicorn          |
| **Frontend**| `cd frontend && npm start`       | 3000  | CRA via CRACO            |
| **Build**   | `cd frontend && npm run build`   |       | Must use this, not react-scripts directly |

## Environment Variables

### Required (Backend)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

### Optional (for full functionality)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (Calendar)

### Frontend (`frontend/.env`)
- `REACT_APP_BACKEND_URL=http://localhost:10000`

## History of Production Breaks

These rules exist because previous agents broke production:

| Date     | What broke                   | Root cause                                          |
|----------|------------------------------|-----------------------------------------------------|
| 2026-03  | Admin dashboard crash        | FacebookTab used but never imported                 |
| 2026-03  | Email sending crash          | SMTP fallback used MIMEMultipart/smtplib without importing them |
| Repeated | Database connection failures | Agents kept adding MongoDB references               |
| Repeated | Email failures               | Agents kept adding SendGrid/SMTP code               |
