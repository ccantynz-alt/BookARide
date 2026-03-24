# BookARide V2

Auckland airport transfer & shuttle booking platform.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: FastAPI + Neon PostgreSQL (asyncpg)
- **Payments**: Stripe + Afterpay
- **Hosting**: Render.com

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your values
uvicorn app.main:app --reload --port 10000

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` for required backend config.
