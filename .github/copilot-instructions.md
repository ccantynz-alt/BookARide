# BookARide - Copilot Instructions

## Repository Overview

BookARide is a full-stack ride booking and management system for a New Zealand luxury transfer service. The system handles customer bookings, driver management, payment processing, flight tracking, and SEO-optimized landing pages.

## Technology Stack

- **Backend**: Python 3.11.9, FastAPI, Motor (async MongoDB)
- **Frontend**: React 18.2, Create React App with CRACO, Tailwind CSS, Radix UI
- **Database**: MongoDB
- **Key Services**: Stripe, Twilio, Mailgun, Google Maps, Google Calendar, AviationStack
- **Deployment**: Render (backend), Vercel/static hosting (frontend)
- **Node Version**: 20.x
- **NPM Version**: 10.x

## Project Structure

```
/
├── backend/                    # FastAPI backend application
│   ├── server.py              # Main FastAPI app (800KB+, contains most routes)
│   ├── start.py               # Entry point (uvicorn server)
│   ├── requirements.txt       # Python dependencies
│   ├── models.py              # Pydantic models
│   ├── routes_*.py            # Modular route files
│   ├── email_sender.py        # Email service integration
│   └── emergentintegrations/  # Emergent LLM integration
├── frontend/                   # React frontend application
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies (Node 20, NPM 10)
│   ├── craco.config.js        # CRACO build configuration
│   └── scripts/               # Build helper scripts
├── .github/
│   └── workflows/             # GitHub Actions CI/CD
├── tests/                      # Empty test directory
├── *.py                       # Various test scripts in root
└── *.md                       # Extensive documentation files
```

## Build & Development Commands

### Backend (Python)

**Important**: Always run from the `/backend` directory or use the root-level `start.py`.

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Start development server (from root)
python start.py
# Or from backend directory:
cd backend
python start.py

# The server runs on port 8000 by default
```

**Environment Setup**: Backend requires a `.env` file with:
- `MONGO_URL`, `DB_NAME` (MongoDB connection)
- `JWT_SECRET_KEY` (authentication)
- `GOOGLE_MAPS_API_KEY`, `STRIPE_API_KEY`, `TWILIO_*`, `MAILGUN_*` (service integrations)
- See `BOOKARIDE_QUICK_REFERENCE.md` for complete `.env` template

### Frontend (React)

**Important**: The build process uses specific Node/NPM versions and has package override configurations.

```bash
# ALWAYS install with exact versions
cd frontend
npm install

# Development server
npm start

# Production build
# NOTE: Build uses CI=false to bypass warnings as errors
npm run build

# The build command includes a doctor-report script that validates the setup
```

**Environment Setup**: Frontend requires `frontend/.env` with:
- `REACT_APP_BACKEND_URL` (backend API endpoint)
- `REACT_APP_GOOGLE_MAPS_API_KEY`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`

**Critical Build Notes**:
- Frontend uses schema-utils version overrides in package.json to resolve dependency conflicts
- Build script uses `CI=false` to prevent warnings from failing the build
- Uses CRACO for build customization instead of ejecting CRA
- Pre-build validation via `scripts/doctor-report.js`

## Testing

**Current State**: The repository has test files but no comprehensive test suite infrastructure.

```bash
# Backend test files (run individually)
python auth_test.py
python booking_system_test.py
python backend_test.py

# Frontend testing
cd frontend
npm test  # React test runner (if tests exist)
```

**Note**: Tests are primarily manual/script-based rather than a formal test framework. When making changes, validate manually by running the application.

## Key Development Workflows

### Making Backend Changes

1. Ensure MongoDB is running (local or connection string in .env)
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Make code changes
4. Test locally: `python start.py`
5. Check logs for errors
6. Test API endpoints manually or with test scripts

### Making Frontend Changes

1. Ensure backend is running (frontend depends on API)
2. Install dependencies: `cd frontend && npm install`
3. Make code changes
4. Run development server: `npm start`
5. **Before committing**: Run `npm run build` to ensure production build works
6. Check browser console for errors

### Database Collections

- `bookings` - All active bookings
- `deleted_bookings` - Soft-deleted bookings (recoverable)
- `drivers` - Driver accounts
- `admin_users` - Admin accounts  
- `seo_pages` - Dynamic SEO landing pages
- `pricing` - Custom pricing rules
- `customers` - Customer database

## Critical Paths and Files

- **Main Backend Entry**: `start.py` (root) or `backend/start.py`
- **Core API Logic**: `backend/server.py` (massive file with most endpoints)
- **Frontend Entry**: `frontend/src/index.js`
- **Main App Component**: `frontend/src/App.js`
- **Build Configuration**: `frontend/craco.config.js`, `frontend/package.json`
- **Deployment Config**: `render.yaml` (Render), `vercel.json.20260211_161925.bak` (Vercel backup)

## Common Issues and Solutions

1. **Frontend Build Failures**: Check schema-utils and babel-loader overrides in package.json
2. **Backend Import Errors**: Ensure you're running from the correct directory (root or backend)
3. **MongoDB Connection Issues**: Verify MONGO_URL in .env and MongoDB service is running
4. **API Integration Errors**: Check all API keys are set in .env files
5. **Port Conflicts**: Backend uses 8000, frontend dev server uses 3000

## CI/CD and Deployment

- **GitHub Actions**: `.github/workflows/npm-publish-github-packages.yml` (runs on release)
- **Render Deployment**: Configured via `render.yaml` for backend
- **Build Command**: Backend uses `pip install -r requirements.txt` then `python start.py`

## Environment-Specific Notes

- Python version is pinned to 3.11.9 (see `runtime.txt`)
- Node/NPM versions are pinned in `frontend/package.json` engines field
- The project has extensive documentation - consult MD files for specific features
- Key references: `BOOKARIDE_QUICK_REFERENCE.md`, `BOOKARIDE_COMPLETE_BUILD_GUIDE.md`

## Best Practices for This Repository

1. **Always check existing documentation first** - This repo has 50+ markdown files with detailed guides
2. **Respect version pins** - Don't upgrade Node, Python, or critical dependencies without testing
3. **Test builds before committing** - Run `npm run build` for frontend changes
4. **Use existing patterns** - Check similar files before creating new routes or components
5. **Preserve environment structure** - Don't modify .env template formats
6. **Backend is monolithic** - Most logic is in server.py, avoid creating too many new route files unless necessary
7. **Check backups** - Many critical files have .bak backups (e.g., package.json, vercel.json)

## When Making Changes

1. Read relevant documentation files first (search the many .md files)
2. Check for existing similar code/patterns
3. Test locally with proper environment setup
4. Verify builds succeed (especially frontend)
5. Don't remove working code unless fixing a security issue
6. Maintain existing code style and patterns
