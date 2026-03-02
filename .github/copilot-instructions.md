# Copilot Instructions for BookARide NZ

## Project Overview
BookARide NZ is a full-stack airport shuttle / private transfer booking platform.
- **Backend**: FastAPI (Python 3.11), single monolithic file at `backend/server.py` (~13,000 lines)
- **Frontend**: React 18 (CRA + CRACO), located in `frontend/`
- **Database**: MongoDB

## Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| **MongoDB** | `mongod --dbpath /data/db --fork --logpath /tmp/mongod.log` | 27017 | Must start before backend |
| **Backend** | `cd /workspace/backend && python3 start.py` | 10000 (env `PORT`) | FastAPI/Uvicorn; reads `backend/.env` |
| **Frontend** | `cd /workspace/frontend && npm start` | 3000 | CRA via CRACO; reads `frontend/.env` |

## Startup Order
1. Start MongoDB: `mongod --dbpath /data/db --fork --logpath /tmp/mongod.log`
2. Start the backend: `cd /workspace/backend && PORT=10000 python3 start.py`
   - On first run it seeds a default admin user (username: `admin`); change the password immediately after first login
3. Start the frontend: `cd /workspace/frontend && BROWSER=none npm start`
   - Requires `REACT_APP_BACKEND_URL=http://localhost:10000` in `frontend/.env`

## Environment Variables

### Backend (`backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=bookaride
JWT_SECRET_KEY=<any-string>
PORT=10000
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:10000
```

External API keys (Stripe, Google Maps, Mailgun, Twilio) are optional for local dev but required for full payment/notification/autocomplete functionality.

## Important Caveats
- `emergentintegrations.payments.stripe.checkout` is a **local** package at `backend/emergentintegrations/`, not a PyPI package.
- Python pip installs to `~/.local/bin`; ensure `PATH` includes this directory for `uvicorn` and `fastapi` CLI commands.
- Node version must be **20.20.0** (per `.nvmrc`). Use `nvm use` after sourcing `~/.nvm/nvm.sh`.
- The frontend uses ESLint 9.x in devDependencies but CRA's internal ESLint 8.x handles linting during builds. There is no standalone `lint` script; linting runs as part of `npm run build`.
- No automated test suite exists (`npm test` exits with "no tests found"). Use `--passWithNoTests` to avoid a non-zero exit.
- MongoDB connection has a 2-second timeout (`serverSelectionTimeoutMS=2000`). The backend starts without MongoDB, but all DB operations will fail at runtime.
- The backend is a single ~13,000-line `server.py` file. Hot reload via Uvicorn works but may be slow on large edits.
