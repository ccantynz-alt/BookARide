# Handover: AI Ledger → Ledger.Ai- Repo

**Date**: 2026-03-19
**From session**: BookARide (claude/ai-accounting-platform-MZIg8)
**Target repo**: `ccantynz-alt/Ledger.Ai-`

---

## What Happened

The AI Ledger platform was built inside the BookARide repo by mistake. The full
application lives at `ai-ledger/` within BookARide. It needs to be moved to its
own repo: `ccantynz-alt/Ledger.Ai-`.

The commit that added it:
```
a59ccdf feat: Add AI Ledger — AI-powered accounting platform with tax treaty management
676ebeb style: Apply linter formatting to routes_auth.py
```

---

## What Needs to Happen

1. Copy the entire `ai-ledger/` directory contents into the root of `Ledger.Ai-`
2. The `ai-ledger/CLAUDE.md` should become the repo root `CLAUDE.md`
3. Add a `.gitignore` (Node + Python)
4. Add a `README.md`
5. Optionally clean up ai-ledger/ from BookARide

---

## The Application (fully built, ready to deploy)

### What It Is
AI-powered accounting platform automating cross-border tax treaty management
between USA, NZ, Australia, and UK. Serves accountants, small firms, and small
businesses.

### Stack

| Layer      | Tech                              | Location               |
|------------|-----------------------------------|------------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`            |
| Backend    | FastAPI, Uvicorn, Python 3.11+    | `backend/`             |
| Database   | Neon PostgreSQL (asyncpg)         | `backend/database.py`  |
| AI         | Anthropic Claude API              | `backend/ai/`          |
| Tax Engine | Custom multi-jurisdiction engine  | `backend/tax_engine/`  |
| Email      | Mailgun API                       | via env vars           |
| Payments   | Stripe                            | via env vars           |

### Locked Decisions (DO NOT CHANGE)
- **Database**: Neon PostgreSQL ONLY — no MongoDB, no Motor, no pymongo
- **Email**: Mailgun ONLY — no SendGrid, no SMTP, no smtplib
- **AI Provider**: Anthropic Claude API
- **Frontend**: CRA + CRACO — not Vite, not Next.js
- **Tax Engine**: Custom built — no third-party tax APIs
- **Helmet**: react-helmet-async (NOT @vuer-ai fork)

### Supported Jurisdictions
US (IRS/GAAP), NZ (IRD/NZ IFRS/GST), AU (ATO/AASB/GST/BAS), UK (HMRC/UK GAAP/VAT/MTD)

### Tax Treaties Covered
All 6 bilateral: US-NZ, US-AU, US-UK, NZ-AU, NZ-UK, AU-UK

---

## File Structure

```
backend/
  main.py                          # FastAPI app entry point
  config.py                        # Settings / env var loading
  database.py                      # Neon PostgreSQL via asyncpg
  auth.py                          # JWT authentication
  schema.sql                       # Full DB schema (24 tables, all acct_ prefixed)
  requirements.txt                 # Python deps
  .env.example                     # Env var template
  ai/
    __init__.py
    ai_service.py                  # Claude API integration
  tax_engine/
    __init__.py
    tax_rules.py                   # Multi-jurisdiction tax rules
    treaty_engine.py               # Treaty analysis engine
  accounting/
    __init__.py
    routes_auth.py                 # Auth endpoints (register, login, password reset)
    routes_core.py                 # Core accounting (chart of accounts, journals)
    routes_invoices.py             # Invoice CRUD
    routes_bank.py                 # Bank feeds (Plaid/Basiq/TrueLayer)
    routes_tax.py                  # Tax returns, treaty analysis
    routes_reports.py              # Financial reports (P&L, balance sheet, etc.)
    routes_ai.py                   # AI assistant endpoints

frontend/
  package.json                     # React 18 + Radix UI + Recharts + Tailwind
  craco.config.js                  # CRACO config (@ alias → src/)
  tailwind.config.js
  postcss.config.js
  jsconfig.json
  public/
    index.html
  src/
    App.js                         # Router setup
    index.js                       # Entry point
    index.css                      # Tailwind imports
    config/
      api.js                       # Axios instance
    lib/
      utils.js                     # cn() helper (clsx + tailwind-merge)
    context/
      AuthContext.js                # JWT auth context
      OrgContext.js                 # Multi-tenant org context
    components/
      shared/
        DashboardLayout.jsx        # Sidebar + header layout
    pages/
      Landing.jsx                  # Public landing page
      Login.jsx                    # Login form
      Register.jsx                 # Registration form
      dashboard/
        DashboardLayout.jsx        # Dashboard shell
        DashboardHome.jsx          # Overview / stats
        Transactions.jsx           # Transaction list
        Invoices.jsx               # Invoice management
        InvoiceNew.jsx             # Create invoice
        Contacts.jsx               # Customer/supplier contacts
        Reports.jsx                # Report listing
        ReportDetail.jsx           # Individual report view
        TaxCenter.jsx              # Tax returns & filing
        TreatyAnalysis.jsx         # Tax treaty analysis
        Reconciliation.jsx         # Bank reconciliation
        Documents.jsx              # Document management
        AIAssistant.jsx            # AI chat assistant
        Settings.jsx               # Org settings
```

---

## Database Schema Summary (24 tables)

All tables prefixed `acct_`. Key tables:
- `acct_organizations` — multi-tenant orgs (US/NZ/AU/UK)
- `acct_users` — auth with roles (owner/admin/accountant/bookkeeper/viewer/client)
- `acct_user_org_access` — user-to-org mapping (one user → many orgs)
- `acct_chart_of_accounts` — hierarchical accounts per org
- `acct_journals` + `acct_journal_lines` — double-entry bookkeeping
- `acct_contacts` — customers/suppliers
- `acct_invoices` + `acct_invoice_lines` — sales/purchase invoices
- `acct_bank_accounts` — linked via Plaid/Basiq/TrueLayer
- `acct_bank_transactions` — bank feed with AI categorization
- `acct_tax_codes` — GST/VAT/sales tax per jurisdiction
- `acct_tax_returns` — filing lifecycle (draft→calculated→filed→accepted)
- `acct_tax_treaties` — bilateral treaty rules (6 combinations)
- `acct_treaty_applications` — applied treaty benefits with savings tracking
- `acct_exchange_rates` — daily FX rates
- `acct_documents` — receipt/invoice storage metadata
- `acct_audit_log` — immutable audit trail
- `acct_ai_conversations` — AI chat history
- `acct_compliance_checks` — automated compliance validation
- `acct_budgets` — budget tracking per fiscal year
- `acct_reconciliations` — bank reconciliation sessions
- `acct_subscriptions` — SaaS plans via Stripe
- `acct_reports_cache` — cached financial reports
- `acct_password_reset_tokens` — password reset flow

---

## Environment Variables

```
DATABASE_URL          — Neon PostgreSQL connection string
JWT_SECRET_KEY        — JWT signing secret
ANTHROPIC_API_KEY     — Claude API key
MAILGUN_API_KEY       — Mailgun API key
MAILGUN_DOMAIN        — Mailgun domain
STRIPE_SECRET_KEY     — Stripe secret
STRIPE_WEBHOOK_SECRET — Stripe webhook secret
GOOGLE_MAPS_API_KEY   — Address validation
PLAID_CLIENT_ID       — US bank feeds
PLAID_SECRET
BASIQ_API_KEY         — AU/NZ bank feeds
TRUELAYER_CLIENT_ID   — UK bank feeds
TRUELAYER_SECRET
```

---

## Build Commands

```bash
# Frontend
cd frontend && npm install && npm run build   # Uses CRACO

# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000
```

---

## Next Steps for New Session

1. Clone `ccantynz-alt/Ledger.Ai-`
2. Copy all files from BookARide's `ai-ledger/` into the repo root
3. Ensure `CLAUDE.md`, `.gitignore`, and `README.md` are at root
4. Commit and push
5. Set up Vercel (frontend) and Render (backend) deployments
