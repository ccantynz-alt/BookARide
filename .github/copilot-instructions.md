# Copilot Instructions for BookARide NZ

## Project Overview
BookARide NZ is a full-stack airport shuttle / private transfer booking platform.
- **Backend**: FastAPI (Python 3.11+), monolithic `backend/server.py` (~14,000 lines)
- **Frontend**: React 18 (CRA + CRACO), located in `frontend/`
- **Database**: Neon PostgreSQL (NOT MongoDB — fully migrated)
- **Email**: Mailgun only (NOT SendGrid, NOT SMTP)

## CRITICAL: Technology Decisions (DO NOT CHANGE)

- **Database**: Neon PostgreSQL via `DATABASE_URL` env var. The compatibility layer in `backend/database.py` (NeonDatabase) translates MongoDB-style API calls to PostgreSQL JSONB queries. NEVER add Motor, pymongo, or MongoDB references.
- **Email**: Mailgun via `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`. NEVER add SendGrid or SMTP.
- **Helmet**: Use `react-helmet-async` (official package). NEVER use `@vuer-ai/react-helmet-async`.

## Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| **Backend** | `cd backend && python3 start.py` | 10000 (env `PORT`) | FastAPI/Uvicorn; reads `backend/.env` |
| **Frontend** | `cd frontend && npm start` | 3000 | CRA via CRACO |

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/bookaride?sslmode=require
JWT_SECRET_KEY=<any-string>
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=mg.bookaride.co.nz
PORT=10000
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:10000
```

External API keys (Stripe, Google Maps, Twilio) are optional for local dev.
**NEVER** add Geoapify or `GEOAPIFY_API_KEY` — we use Google Maps exclusively.

## Important Notes
- `backend/database.py` is the Neon PostgreSQL compatibility layer — mimics Motor's async API
- `backend/schema.sql` defines all PostgreSQL tables (JSONB storage pattern)
- No automated test suite exists (`npm test` exits with "no tests found")
- The backend is a single ~14,000-line `server.py` file
- Python dependencies: `backend/requirements.txt` (NO motor/pymongo)
