# AI Ledger — Agent Instructions

## Overview

AI Ledger is an AI-powered accounting platform that automates cross-border tax treaty management between the USA, New Zealand, Australia, and the UK. It serves accountants, small firms, and small businesses.

## Stack

| Layer      | Tech                              | Location               |
|------------|-----------------------------------|------------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`            |
| Backend    | FastAPI, Uvicorn, Python 3.11+    | `backend/`             |
| Database   | Neon PostgreSQL (asyncpg)         | `backend/database.py`  |
| AI         | Anthropic Claude API              | `backend/ai/`          |
| Tax Engine | Custom multi-jurisdiction engine  | `backend/tax_engine/`  |
| Email      | Mailgun API                       | via env vars           |
| Payments   | Stripe                            | via env vars           |

## Key Directories

- `backend/accounting/` — API route files (auth, core, invoices, bank, tax, reports, AI)
- `backend/ai/` — AI service layer (Claude API integration)
- `backend/tax_engine/` — Tax rules engine + treaty engine
- `frontend/src/pages/` — React page components
- `frontend/src/components/` — Reusable components

## Locked Decisions

1. **Database**: Neon PostgreSQL ONLY (no MongoDB)
2. **Email**: Mailgun ONLY (no SendGrid, no SMTP)
3. **AI Provider**: Anthropic Claude API
4. **Frontend**: CRA + CRACO (not Vite, not Next.js)
5. **Tax Engine**: Custom built (no third-party tax APIs)

## Build Commands

```bash
cd frontend && npm run build   # Uses CRACO
cd backend && uvicorn main:app --host 0.0.0.0 --port 10000
```

## Supported Jurisdictions

- US (IRS, GAAP, federal/state taxes)
- NZ (IRD, NZ IFRS, GST)
- AU (ATO, AASB, GST/BAS)
- UK (HMRC, UK GAAP, VAT, Making Tax Digital)

## Tax Treaties Covered

All 6 bilateral combinations: US-NZ, US-AU, US-UK, NZ-AU, NZ-UK, AU-UK
