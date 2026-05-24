# Copilot Instructions for BookARide NZ

## Project Overview

BookARide NZ is a full-stack airport shuttle / private transfer booking platform serving New Zealand.

- **Frontend**: React 18 + Vite, Tailwind CSS, located in `frontend/`
- **API**: Vercel serverless functions (Node.js), located in `api/`
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` (NOT MongoDB — fully migrated)
- **Email**: Mailgun only (NOT SendGrid, NOT SMTP)
- **Payments**: Stripe
- **SMS**: Twilio
- **Maps**: Google Maps API (NOT Geoapify)
- **Hosting**: Everything on Vercel (frontend + serverless API)

**IMPORTANT**: The `backend/` directory contains DEAD CODE from the old Python/Render architecture. It is NOT deployed and does NOT run in production. All active API endpoints are in `api/` as Vercel serverless functions.

## LOCKED DECISIONS — DO NOT CHANGE

These technology choices are final. Do not introduce alternatives, fallbacks, or "improvements".

### Database: Neon PostgreSQL ONLY
- Connection via `DATABASE_URL` env var
- Database operations: `api/_lib/db.js` (uses `@neondatabase/serverless` for HTTP connections)
- **NEVER** add `motor`, `pymongo`, `MongoClient`, or any MongoDB driver
- **NEVER** reference `MONGO_URL`, `DB_NAME`, or `mongodb://` anything
- Note: `backend/database.py` is dead code from the old architecture

### Email: Mailgun ONLY
- Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars
- Email sending: `api/_lib/mailgun.js` (Mailgun HTTP API only)
- **NEVER** add SendGrid, `smtplib`, `MIMEMultipart`, `MIMEText`, or SMTP code
- **NEVER** add `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars
- Note: `backend/email_sender.py` is dead code from the old architecture

### Frontend: Vite + React (NOT CRA, NOT Next.js)
- Build: `vite build` (output to `build/` directory)
- Dev server: `vite` (port 3000, instant hot reload)
- The `@` alias is configured in `vite.config.js` → resolves to `src/`
- Environment variables use `VITE_` prefix (e.g., `VITE_BACKEND_URL`)
- **NEVER** use `process.env.REACT_APP_*` — use `import.meta.env.VITE_*`
- **NEVER** migrate to Next.js unless explicitly asked
- Helmet: Use `react-helmet-async` (official). NEVER use `@vuer-ai/react-helmet-async`.

### Maps: Google Maps API ONLY (No Geoapify)
- Distance calculation: Server-side via `api/_lib/google-maps.js`
- Autocomplete: Server-side via `api/places/autocomplete.js`
- Config: `GOOGLE_MAPS_API_KEY` env var (set in Vercel)
- **NEVER** load Google Maps JS in the browser — server-side only
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
8. Am I working in the `backend/` directory? **STOP — that's dead code, work in `api/` instead.**
9. Am I using `process.env.REACT_APP_*`? **STOP — use `import.meta.env.VITE_*` instead.**

## Architecture

**Current (as of 2026-04-07): Vercel Frontend + Vercel Serverless API**

The site is a single Vercel deployment with:
- **Frontend**: React 18 + Vite, served from `frontend/build/` (built from `frontend/src/`)
- **API**: Vercel serverless functions in the root `api/` directory (Node.js). All `/api/*` routes.
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` (HTTP, no TCP pool)
- **Deployment config**: Root `vercel.json` builds the frontend and deploys the `api/` folder as serverless functions

**The `backend/` directory is DEAD CODE.** It contains the old Python FastAPI server that ran on Render. It is no longer deployed or used at runtime.

| Layer      | Tech                              | Location                  |
|------------|-----------------------------------|---------------------------|
| Frontend   | React 18, Vite, Tailwind          | `frontend/`               |
| API        | Vercel serverless (Node.js)       | `api/`                    |
| Database   | Neon PostgreSQL via HTTP          | `api/_lib/db.js`          |
| Email      | Mailgun API                       | `api/_lib/mailgun.js`     |
| Payments   | Stripe                            | `api/payment/`            |
| SMS        | Twilio                            | via env vars              |
| Maps       | Google Maps API                   | `api/_lib/google-maps.js` |

## Services

| Service     | Command                          | Port  | Notes                    |
|-------------|----------------------------------|-------|--------------------------|
| **Frontend**| `cd frontend && npm run dev`     | 3000  | Vite dev server          |
| **Build**   | `cd frontend && npm run build`   |       | Vite build (fast)        |
| **API Local**| Vercel CLI: `vercel dev`        | 3000  | Local serverless testing |

**Note**: The old `backend/` Python server commands are no longer used.

## Environment Variables

**All credentials are configured in Vercel's Environment Variables settings — NOT in a `.env` file in the repo.**

### Required (Vercel)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

### Optional (for full functionality, all set in Vercel)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `ANTHROPIC_API_KEY` (for AI chatbot and email support)

### Frontend (`frontend/.env.local` for local dev only)
- `VITE_BACKEND_URL` — empty string for production (same-origin /api/* calls)

## History of Production Breaks

These rules exist because previous agents broke production:

| Date     | What broke                   | Root cause                                          |
|----------|------------------------------|-----------------------------------------------------|
| 2026-03  | Admin dashboard crash        | FacebookTab used but never imported                 |
| 2026-03  | Email sending crash          | SMTP fallback used MIMEMultipart/smtplib without importing them |
| Repeated | Database connection failures | Agents kept adding MongoDB references               |
| Repeated | Email failures               | Agents kept adding SendGrid/SMTP code               |
