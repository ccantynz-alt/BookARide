# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
BookARide NZ — a full-stack airport shuttle / private transfer booking platform. FastAPI backend (Python 3.11, single monolithic `backend/server.py`) + React 18 frontend (CRA + CRACO, in `frontend/`). MongoDB is the primary datastore.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| **MongoDB** | `mongod --dbpath /data/db --fork --logpath /tmp/mongod.log` | 27017 | Must start before backend |
| **Backend** | `cd /workspace/backend && python3 start.py` | 10000 (env `PORT`) | FastAPI/Uvicorn; reads `backend/.env` |
| **Frontend** | `cd /workspace/frontend && npm start` | 3000 | CRA via CRACO; reads `frontend/.env` |

### Startup order
1. Start MongoDB first (`mongod --dbpath /data/db --fork --logpath /tmp/mongod.log`).
2. Start the backend (`cd /workspace/backend && PORT=10000 python3 start.py`). On first run it seeds a default admin user (`admin` / `Kongkong2025!@`).
3. Start the frontend (`cd /workspace/frontend && BROWSER=none npm start`). Set `REACT_APP_BACKEND_URL=http://localhost:10000` in `frontend/.env`.

### Environment variables
Backend requires `backend/.env` with at minimum:
- `MONGO_URL=mongodb://localhost:27017`
- `DB_NAME=bookaride`
- `JWT_SECRET_KEY=<any-string>`
- `PORT=10000`

Frontend requires `frontend/.env` with:
- `REACT_APP_BACKEND_URL=http://localhost:10000`

External API keys (Stripe, Google Maps, Mailgun, Twilio) are optional for local dev but required for full payment/notification/autocomplete functionality.

### Non-obvious caveats
- The backend import `emergentintegrations.payments.stripe.checkout` is a **local** package at `backend/emergentintegrations/`, not a PyPI package.
- Python pip installs to `~/.local/bin`; ensure `PATH` includes this directory for `uvicorn` and `fastapi` CLI commands.
- Node version must be **20.20.0** (per `.nvmrc`). Use `nvm use` after sourcing `~/.nvm/nvm.sh`.
- The frontend uses ESLint 9.x in devDependencies but CRA's internal ESLint 8.x handles linting during builds. There is no standalone `lint` script; linting runs as part of `npm run build`.
- No automated test suite exists (`npm test` exits with "no tests found"). Use `--passWithNoTests` to avoid non-zero exit.
- MongoDB connection has a 2-second timeout (`serverSelectionTimeoutMS=2000`). The backend starts successfully even without MongoDB, but all DB operations will fail at runtime.
- The backend is a single ~13,000-line `server.py` file. Hot reload via Uvicorn works but may be slow on large edits.
