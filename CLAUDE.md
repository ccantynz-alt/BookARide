# BookARide NZ — Agent Instructions

**READ THIS ENTIRE FILE BEFORE MAKING ANY CHANGES.**
**EVERY rule here exists because a previous agent broke production by ignoring it.**

---

## THE 10 RULES — MANDATORY FOR EVERY AGENT SESSION

These rules are non-negotiable. Every agent must follow all 10, every session, no exceptions.

| # | Rule | What It Means |
|---|------|---------------|
| 1 | **Scan Before You Build** | Every session starts by checking for security issues, broken code, and problems — BEFORE doing anything new. Run the Engineering Gap Scan (see Mandatory Automated Checks below). |
| 2 | **Auto-Repair** | If you find a bug while working on anything, fix it immediately. No "that's out of scope" excuses. No deferring. No logging for later. FIX IT NOW. |
| 3 | **Proactive Research** | Before building anything significant, check if there's a better library, technique, or approach. No guessing. Verify imports exist, check versions, read docs. |
| 4 | **Engineering Gap Detection** | Systematically check for: features that promise something the code can't deliver, missing error handling, security gaps, dead code, broken references, field name mismatches. |
| 5 | **Technology Currency** | Check if our tools are up to date. If there's a newer, safer, better-supported version of a dependency — flag it. Don't silently use outdated or deprecated APIs. |
| 6 | **Explain Like You're Not A Developer** | The owner is NOT a developer. All communication in plain English. "Your users were seeing X, now they see Y" — not tech jargon. No acronyms without explanation. |
| 7 | **Never Leave It Worse** | Every file you touch gets cleaned up. No leaving messes behind. No orphaned imports. No dead code. No commented-out blocks. Leave it better than you found it. |
| 8 | **Autonomous Testing** | After changes, verify everything still works. Run `py_compile`, run `npm run build`, check for smart quotes, check for banned imports. No "it should be fine." |
| 9 | **Mandatory Documentation** | Every change gets documented so the next session knows what happened. Update CLAUDE.md if you add new rules, locked decisions, or break history. Commit messages must explain WHY, not just WHAT. |
| 10 | **Complete The Loop** | Every feature must work end-to-end. If it doesn't work from start to finish — form loads, user types, autocomplete appears, user selects, price calculates, booking submits, payment works, confirmation sends — it's not done. |

---

## LOCKED DECISIONS — DO NOT CHANGE, REVERT, OR "IMPROVE"

These decisions are FINAL. Do not introduce alternatives, fallbacks, or "improvements".

### 1. Database: Neon PostgreSQL ONLY

We migrated FROM MongoDB TO Neon PostgreSQL. This is DONE. Do not touch it.

- Connection: `DATABASE_URL` env var (Neon PostgreSQL connection string)
- Compatibility layer: `backend/database.py` (NeonDatabase class — mimics Motor API over PostgreSQL JSONB)
- Schema: `backend/schema.sql`
- **NEVER** add `motor`, `pymongo`, `MongoClient`, or any MongoDB driver
- **NEVER** reference `MONGO_URL`, `DB_NAME`, or `mongodb://` anything
- **NEVER** fall back to `mongodb://localhost:27017`
- **NEVER** add a "MongoDB fallback" or "MongoDB option"

### 2. Email: Mailgun ONLY

We use Mailgun. Not SendGrid. Not SMTP. Not Gmail. Not "a fallback".

- Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars
- Sender module: `backend/email_sender.py` (Mailgun HTTP API only)
- **NEVER** add SendGrid, `smtplib`, `MIMEMultipart`, `MIMEText`, or SMTP code
- **NEVER** add `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars
- **NEVER** add "email fallback" logic — if Mailgun fails, log the error, that's it

### 3. Helmet: react-helmet-async (official)

- **NEVER** use `@vuer-ai/react-helmet-async` — it's a broken fork

### 4. Frontend: CRA + CRACO (NOT Vite, NOT Next.js)

- Build: `craco build` (NOT `react-scripts build`)
- The `@` alias is configured in `craco.config.js` → resolves to `src/`
- **NEVER** migrate to Vite or Next.js unless explicitly asked

### 5. No Facebook Integration

- Facebook integration was removed (caused production crashes)
- **NEVER** re-add FacebookTab or Facebook API routes
- **NEVER** add `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` references

### 7. No Shared Shuttle Service

The shared shuttle service has been completely removed from the admin system and codebase.

- **NEVER** re-add the shuttle tab to AdminDashboard
- **NEVER** re-add `SharedShuttle.jsx` or `ShuttleDriverPortal.jsx`
- **NEVER** re-add shuttle API endpoints (`/api/shuttle/*`)
- Backend shuttle endpoints and pricing code have been removed from `server.py`
- Note: "airport-shuttle" as a `serviceType` for regular bookings is STILL VALID — that's the core private transfer service, not the shared shuttle

### 8. Customer Confirmation Design — LOCKED

The customer confirmation email design is FINAL and must not change:

- Payment method "stripe" displays as "Credit/Debit Card" (never show "Stripe" to customers)
- Payment status shows as green "PAID" badge when payment_status == 'paid'
- PaymentSuccess.jsx shows "Payment Successful!" with booking details — no Stripe branding
- **NEVER** show "Stripe" text in customer-facing emails or pages
- **NEVER** change the confirmation email layout/design without explicit permission

### 6. Maps & Distance: Google Maps API ONLY (No Geoapify)

We use Google Maps for distance calculation, directions, and autocomplete. Geoapify has been removed.

- Distance: `_get_distance_google()` in `backend/server.py` (Distance Matrix + Directions API)
- Config: `GOOGLE_MAPS_API_KEY` env var
- **NEVER** add Geoapify API calls, `GEOAPIFY_API_KEY`, or `geoapify.com` references
- **NEVER** add Geoapify as a "fallback" for Google Maps
- **NEVER** use Geoapify for address autocomplete or distance calculation

### 7. Pricing Rules — DO NOT CHANGE WITHOUT OWNER APPROVAL

These are the AUTHORITATIVE per-km rates. They match the WordPress pricing plugin (screenshot verified 2026-03-13).
Any agent that changes these rates without explicit owner instruction is breaking production pricing.

**Tiered Per-Kilometer Rates** (bracket-based — entire distance charged at ONE rate):

| From (km) | To (km) | Rate per km (NZD) |
|-----------|---------|-------------------|
| 0.1       | 15.0    | $12.00            |
| 15.0      | 15.8    | $8.00             |
| 15.8      | 16.0    | $6.00             |
| 16.0      | 25.5    | $5.50             |
| 25.5      | 35.0    | $5.00             |
| 35.0      | 50.0    | $4.00             |
| 50.0      | 60.0    | $2.60             |
| 60.0      | 75.0    | $2.47             |
| 75.0      | 100.0   | $2.70             |
| 100.0     | 300.0   | $3.50             |

**Code location**: `backend/server.py` lines 1681-1700 (and duplicated in concert pricing lines 1733-1746)

**Add-on fees**:
- VIP Airport Pickup: $15.00
- Oversized Luggage: $25.00
- Extra Passengers: $5.00 per additional (1st included)

**Minimums**:
- Standard minimum: $150.00 per one-way leg
- Matakana Country Park concert: $550.00 flat return (from Hibiscus Coast)

**Stripe processing fee**: Passed to customer — `(subtotal × 2.9%) + $0.30 NZD`

- **NEVER** change these rates without explicit owner approval
- **NEVER** "simplify" or "optimize" the tier structure
- **NEVER** remove the Stripe fee pass-through to customer

### 8. Shuttle Service — REMOVED (2026-03-13)

The shared shuttle service has been completely removed from both frontend and backend.

- **Backend**: All shuttle endpoints (`/shuttle/*`), models (`ShuttleBookingCreate`), constants (`SHUTTLE_PRICING`, `SHUTTLE_TIMES`) removed from `server.py`
- **Database**: `shuttle_bookings` and `shuttle_runs` tables dropped from `schema.sql`
- **Frontend**: Shuttle tab, state, handlers all removed from `AdminDashboard.jsx`; `FacebookTab.jsx` component deleted
- **Booking list**: `GET /api/bookings` now excludes `serviceType: 'shared-shuttle'` from results
- **Service types**: Changed from `airport-shuttle` to `airport-transfer`
- **NEVER** re-add shuttle service endpoints, models, or UI tabs
- **NEVER** re-add `FacebookTab.jsx` or Facebook integration
- **NEVER** add `Bus` icon import back to AdminDashboard

### 9. Booking System Architecture Rules (2026-03-13)

These rules exist because the admin dashboard was 68,000+ lines with severe performance issues.

**Backend rules**:
- `GET /api/bookings` must ALWAYS exclude shuttle bookings (`serviceType != 'shared-shuttle'`)
- Booking count endpoint uses single query with in-memory counting (not 6 separate DB calls)
- Orphan payment check uses batch `$in` query (not N+1 per-payment lookups)
- Soft-delete has rollback: if `delete_one` fails after `insert_one` to `deleted_bookings`, the insert is rolled back
- **NEVER** load all bookings with `.to_list(None)` without a filter — always exclude shuttle/irrelevant data

**Frontend rules**:
- Action buttons must have `e.stopPropagation()`, `min-w-[36px]`, and `cursor-pointer` for reliable clicking
- **NEVER** re-add the shuttle tab or `Bus` icon to the tabs navigation
- Service type options are: `airport-transfer` and `private-transfer` (NOT `airport-shuttle`)

### 10. One Pickup Address Only — EVERYWHERE (2026-03-21)

Multiple pickup was removed from ALL forms — customer AND admin. Keep it simple.

- **ONE pickup address only** — no "Add another pickup" button anywhere
- **NEVER** re-add `pickupAddresses` array, `handleAddPickup`, `handleRemovePickup`, or `handlePickupAddressChange` to ANY form
- **NEVER** add multi-stop pickup UI to BookNow.jsx, CreateBookingModal.jsx, or EditBookingModal.jsx
- If a customer needs multiple pickups, they can note it in the "Notes" field and admin handles it manually
- The backend `pickupAddresses` field may still exist in old bookings but no new bookings should use it

### 11. AI Email Support — Claude API via Mailgun (2026-03-21)

`support@bookaride.co.nz` is an AI-powered booking support inbox using Claude (Haiku).

**How it works:**
1. Customer emails `support@bookaride.co.nz`
2. Mailgun receives the email (MX record on root domain) and forwards to `POST /api/email/incoming` webhook
3. Backend looks up the customer's booking history by email
4. Claude generates a context-aware response with booking details, pricing guidance, and policies
5. Reply is sent via Mailgun from `support@bookaride.co.nz`
6. Admin gets a copy of both the customer's email and the AI response
7. Interaction is logged in `email_logs` table for admin review

**Configuration (all in Render env vars):**
- `ANTHROPIC_API_KEY` — Claude API key (required for AI responses, falls back to static reply if missing)
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` — for sending replies
- Mailgun inbound route: `support@bookaride.co.nz` → `https://<backend>/api/email/incoming`

**DNS required (one-time setup):**
- MX record on `bookaride.co.nz` → `mxa.mailgun.org` (priority 10) and `mxb.mailgun.org` (priority 10)
- This enables Mailgun to receive emails at `@bookaride.co.nz`

**Rules:**
- Model: `claude-haiku-4-5-20251001` (fast, cheap, good enough for support)
- Max 500 tokens per response — keep replies concise
- Rate limit: 5 AI replies per sender per day
- **NEVER** use GPT, OpenAI, or any other LLM provider — Claude only
- **NEVER** expose booking details of other customers
- **NEVER** make up prices — always direct to bookaride.co.nz/book-now for exact quotes
- Falls back gracefully to static auto-reply if Claude API is down or unconfigured
- Admin is always notified of incoming support emails

### 12. AI Automation Agents (2026-03-25)

The system now runs multiple AI-powered and scheduled automation agents. All are defined in `backend/server.py`.

**Active Agents:**

| # | Agent | Endpoint / Trigger | Details |
|---|-------|--------------------|---------|
| 1 | **AI Chatbot** | `POST /api/chatbot/message` | Customer-facing chat powered by Claude Haiku. Rate limited to 20 messages per hour per session. Provides booking help, pricing guidance, and company info. |
| 2 | **AI Email Support** | `POST /api/email/incoming` (Mailgun webhook) | Already documented in section 11. Now also supports action capabilities: resend confirmation, flag cancellation request, flag modification request, and urgent escalation to admin. |
| 3 | **Auto-complete Bookings** | Scheduled daily at 10 PM NZ time | Automatically marks past confirmed+paid bookings as `completed`. Prevents stale bookings sitting in active list forever. |
| 4 | **Post-trip Thank You Email** | Triggered when booking status changes to `completed` | Sends a thank-you email to the customer with a Google Review link. Encourages organic reviews. |
| 5 | **Daily Business Summary** | Scheduled daily at 6 PM NZ time | Emails admin with today's booking stats (count, revenue, status breakdown) and tomorrow's upcoming bookings list. |
| 6 | **Payment Follow-up** | Scheduled every 2 hours | Finds unpaid Stripe bookings between 4-48 hours old and sends a payment reminder email to the customer. |
| 7 | **Booking Conflict Detection** | Triggered on every new booking creation | Checks for driver double-bookings (overlapping pickup times for the same assigned driver). Alerts admin if a conflict is detected. |
| 8 | **Weekly Performance Report** | Scheduled Sunday 8 AM NZ time | Emails admin a weekly summary: total bookings, revenue, completion rate, popular routes, and driver performance. |

**Rules for ALL automation agents:**
- All AI agents use `claude-haiku-4-5-20251001` — **NEVER** use GPT, OpenAI, or any other LLM provider
- All emails sent via Mailgun — **NEVER** use SMTP, SendGrid, or any other email provider
- All scheduled agents must have duplicate prevention flags (e.g., check if already sent today before sending again)
- All agents must log errors with `logger.error(f"CRITICAL: ...")` — never swallow errors silently
- **NEVER** remove or disable an automation agent without explicit owner approval
- **NEVER** change rate limits, schedules, or thresholds without explicit owner approval

### 13. Admin Dashboard Tabs (2026-03-25)

The admin dashboard (`AdminDashboard.jsx`) has 10 active tabs. These are the canonical tabs — do not remove or reorder without owner approval.

| # | Tab Name | Component | Icon (lucide-react) |
|---|----------|-----------|---------------------|
| 1 | Bookings | (inline in AdminDashboard) | Main tab |
| 2 | Deleted | (inline in AdminDashboard) | Trash-related |
| 3 | Archive | (inline in AdminDashboard) | Archive |
| 4 | Customers | (inline in AdminDashboard) | Users |
| 5 | Import | (inline in AdminDashboard) | Upload |
| 6 | Cockpit | (inline in AdminDashboard) | Dashboard/Gauge |
| 7 | Drivers | `DriversTab` component | Car/User |
| 8 | Applications | `DriverApplicationsTab` component | ClipboardList |
| 9 | Analytics | `AnalyticsTab` component | BarChart |
| 10 | Marketing | `LandingPagesTab` component | Megaphone |

**Rules:**
- **NEVER** remove existing tabs without explicit owner approval
- All new tabs must have an icon from `lucide-react`
- Component files: `DriversTab.jsx`, `DriverApplicationsTab.jsx`, `AnalyticsTab.jsx`, `LandingPagesTab.jsx`
- Every tab must have both a `TabsTrigger` button AND a `TabsContent` panel — if either is missing, the tab is invisible or broken
- **NEVER** re-add the shuttle tab or `Bus` icon (see Locked Decision #8)

### 14. Parallel Checking Rule (2026-03-25)

**When fixing any form (customer-facing OR admin), the agent MUST check ALL forms that share similar functionality in the SAME session.**

This means:
- **NEVER** fix `BookNow.jsx` without also checking `CreateBookingModal.jsx`, `EditBookingModal.jsx`, and AdminDashboard inline editing
- **NEVER** fix `CreateBookingModal.jsx` without also checking `BookNow.jsx`, `EditBookingModal.jsx`, and AdminDashboard inline editing
- **NEVER** fix `EditBookingModal.jsx` without also checking `BookNow.jsx`, `CreateBookingModal.jsx`, and AdminDashboard inline editing
- The same bug pattern (e.g., wrong field name, missing validation, broken dropdown) is almost always present in ALL forms — fix them all at once

This rule exists because agents repeatedly fixed one form while leaving the identical bug in 2-3 other forms, causing the same issue to resurface in different contexts.

---

## MANDATORY AUTOMATED CHECKS — RUN BEFORE EVERY COMMIT

**These checks are NON-NEGOTIABLE. Every agent session MUST run ALL of them before committing ANY code.**
**The owner is not a developer — agents are 100% responsible for code quality. No excuses.**

### Step 1: Engineering Gap Scan (run EVERY session, even if "not related" to your task)

Before starting work, scan for and fix existing issues. These are silent production killers:

```bash
# 1. Smart/curly quotes (cause Python SyntaxError — invisible in most editors)
python3 -c "
import glob
for f in glob.glob('backend/**/*.py', recursive=True):
    content = open(f, encoding='utf-8').read()
    for char, name in [('\u2018','left-sq'), ('\u2019','right-sq'), ('\u201C','left-dq'), ('\u201D','right-dq')]:
        if char in content:
            print(f'FAIL: {f} contains {name} smart quote — replace with ASCII quotes')
"

# 2. Python syntax check (catches what smart quotes, bad indentation, etc.)
python3 -m py_compile backend/server.py
python3 -m py_compile backend/database.py
python3 -m py_compile backend/email_sender.py

# 3. Frontend build
cd frontend && npm run build

# 4. Check for banned imports/references
grep -rn "pymongo\|MongoClient\|motor\|mongodb://" backend/ && echo "FAIL: MongoDB references found" || true
grep -rn "SendGrid\|sendgrid\|smtplib\|MIMEMultipart\|MIMEText" backend/ && echo "FAIL: SMTP/SendGrid references found" || true
grep -rn "geoapify\|GEOAPIFY" backend/ frontend/src/ && echo "FAIL: Geoapify references found" || true
grep -rn "airport-shuttle" frontend/src/ backend/ && echo "FAIL: Removed service type 'airport-shuttle' found" || true
grep -rn "@vuer-ai/react-helmet-async" frontend/ && echo "FAIL: Broken helmet fork found" || true
```

**If ANY of these fail, fix them IMMEDIATELY before doing anything else.**

### Step 2: Pre-Commit Verification (run before EVERY commit)

```bash
# 1. Python syntax — ALL .py files that were changed
python3 -m py_compile <each changed .py file>

# 2. Frontend build — if ANY frontend file changed
cd frontend && npm run build

# 3. No smart quotes in changed files
python3 -c "content=open('<file>').read(); assert '\u2018' not in content and '\u2019' not in content and '\u201c' not in content and '\u201d' not in content, 'Smart quotes found!'"

# 4. No console.log left in production code (except intentional debug endpoints)
grep -rn "console\.log" frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v "// debug" || true

# 5. No broken imports — verify every import resolves
# For Python: check that imported modules exist
# For React: check that imported components exist in the project
```

### Step 3: Proactive Bug Hunt (run at START of every session)

Every agent MUST spend the first few minutes scanning for issues, not just jumping to the assigned task:

1. **Check for runtime errors**: Look at recent git history for hastily-added code that might have bugs
2. **Check for encoding issues**: Smart quotes, BOM characters, non-ASCII in Python source files
3. **Check for dead code**: Unused imports, unreachable functions, orphaned components
4. **Check for broken references**: Components imported but not existing, API endpoints called but not defined
5. **Check for inconsistencies**: camelCase vs snake_case in database fields, mismatched field names between frontend and backend
6. **If you find ANY issue, fix it immediately** — do not defer it, do not log it for later, FIX IT NOW

### Step 4: Post-Change Validation

After making changes, before committing:

1. **Test the full path**: If you changed a backend endpoint, verify the frontend calls it correctly
2. **Test related features**: If you changed pricing, verify the booking form still calculates correctly
3. **Check for regressions**: Did your change break anything that was working before?
4. **Verify deploy compatibility**: Will this work on both Vercel (frontend) AND Render (backend)?

---

## PRE-CHANGE CHECKLIST

Before making ANY change, verify:

1. Does my change introduce MongoDB, Motor, or pymongo? **STOP.**
2. Does my change introduce SendGrid, SMTP, or smtplib? **STOP.**
3. Does my change introduce Geoapify or `GEOAPIFY_API_KEY`? **STOP.**
4. Does my change add a new import? **Verify the component/module exists first.**
5. Does my change remove or modify an existing import? **Verify nothing else uses it.**
6. Am I adding a new JSX component usage? **Add the import statement too.**
7. Does my build pass with `cd frontend && npm run build`? **Test before committing.**
8. Does my Python code pass `python3 -m py_compile`? **Test before committing.**
9. Does my code contain smart/curly quotes? **Replace with ASCII quotes.**
10. Have I scanned for engineering gaps unrelated to my task? **Fix them too.**

---

## Stack

| Layer      | Tech                              | Location           |
|------------|-----------------------------------|--------------------|
| Frontend   | React 18, CRA + CRACO, Tailwind  | `frontend/`        |
| Backend    | FastAPI, Uvicorn, Python 3.11+    | `backend/`         |
| Database   | Neon PostgreSQL via asyncpg       | `backend/database.py` |
| Email      | Mailgun API                       | `backend/email_sender.py` |
| Payments   | Stripe                            | `backend/stripe_checkout/` |
| SMS        | Twilio                            | via env vars       |
| Maps       | Google Maps API                   | via env vars       |
| AI Support | Claude API (Haiku)                | `backend/server.py` |

## Hosting

- Frontend: **Vercel** (React 18, CRA + CRACO)
- Backend: **Render** (FastAPI/Uvicorn, Python 3.11+)

## Backend Architecture

- Main server: `backend/server.py` (~14,000 lines, monolithic)
- Database layer: `backend/database.py` — NeonDatabase class that translates
  MongoDB-style queries (find_one, update_one, etc.) to PostgreSQL JSONB operations
- The `db` global is initialized in the startup event from `DATABASE_URL`
- Route files: `backend/routes_*.py` (bulk, customers, drivers, vehicles, analytics, settings, templates)

## Environment Variables (Render)

**All credentials are configured in Render's Environment tab — NOT in a `.env` file in the repo.**
The absence of a `.env` file does NOT mean credentials are missing. Do NOT assume services are unconfigured.
See `backend/.env.example` for the full list of variables (template only — no real secrets).

Required (all set in Render):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Optional (but needed for full functionality, all set in Render):
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (Calendar + Search Console)

## Build & Test

```bash
# Frontend build (MUST use npm run build, not react-scripts directly)
cd frontend && npm run build

# Backend start
cd backend && python3 start.py
```

---

## Booking System Architecture

### Booking Flow (Customer → Admin)

1. Customer submits booking via `BookNow.jsx` → `POST /api/bookings` → creates booking in `db.bookings`
2. If within 24 hours: status = `pending_approval` (requires admin manual approval)
3. If Stripe payment: `POST /api/payment/create-checkout` → Stripe → webhook updates booking to `paid`/`confirmed`
4. Admin sees ALL bookings at `GET /api/bookings` (fetches from `db.bookings` ONLY)

### Orphan Payment Recovery

If a customer pays via Stripe but the booking is missing from admin:
- `GET /api/bookings/orphan-payments` — lists paid Stripe transactions with no matching booking
- `POST /api/bookings/recover-from-payment` — creates a booking from the payment data
- The admin dashboard has a "Check Orphan Payments" button for this

### Known Booking System Issues (Fixed 2026-03-11)

- Pydantic `Booking(**b)` validation was silently dropping bookings with missing/invalid fields
- Shuttle bookings were being merged into admin panel causing confusion
- SMTP code existed in `routes_bulk.py` violating Mailgun-only rule
- Orphaned `validate_booking_date` function at module level (not inside any class)

### Known Booking System Issues (Fixed 2026-03-18)

- `insert_many()` was missing from `database.py` — backup restore would crash with AttributeError
- Stripe webhook did not verify `matched_count` after updating booking — payment could succeed but booking status not update
- iCloud contact sync was not triggered after Stripe payment webhook — only on initial booking creation
- Shared shuttle service tab/code removed from admin dashboard (was cluttering the admin panel)
- ALL delete/archive/restore operations now verify backup insert + find_one before deleting source record
- Bulk delete only removes bookings that were successfully backed up (per-record verification)
- Orphan payment recovery now verifies the recovered booking was actually created

### ZERO BOOKING LOSS RULES — MANDATORY

**A booking must NEVER be lost. These rules are absolute and non-negotiable.**

#### Rule 1: NEVER delete without verified backup

Before deleting a booking from ANY collection, the backup/destination insert MUST be:
1. Verified with `result.acknowledged == True`
2. Double-checked with `find_one()` to confirm the record exists in the destination
3. Only THEN can the source record be deleted

This applies to ALL move operations:
- `delete_booking()` → must verify `deleted_bookings.insert_one()` before `bookings.delete_one()`
- `archive_booking()` → must verify `bookings_archive.insert_one()` before `bookings.delete_one()`
- `restore_booking()` → must verify `bookings.insert_one()` before `deleted_bookings.delete_one()`
- `unarchive_booking()` → must verify `bookings.insert_one()` before `bookings_archive.delete_one()`
- Bulk versions of all the above follow the same pattern per-record

**If the backup/verify fails, ABORT the delete and raise an error. The booking stays where it is.**

#### Rule 2: NEVER silently drop bookings on read

- `GET /api/bookings` uses `model_construct()` (not `Booking(**b)`) to skip validators
- Three-tier fallback ensures every record is returned even if fields are missing/invalid
- **NEVER** switch back to `Booking(**b)` for reading — it silently drops records with missing fields

#### Rule 3: VERIFY all critical inserts

After inserting a booking (creation, recovery, import), verify with `find_one()`:
- `POST /api/bookings` — already has double-check
- `POST /api/bookings/recover-from-payment` — verified after insert
- Import/CSV endpoints — must verify each insert

#### Rule 4: After payment confirmation, trigger ALL 4 actions

Every payment confirmation path (webhook, polling, manual) must call:
1. `send_customer_confirmation(booking)` — email/SMS
2. `send_booking_notification_to_admin(booking)` — admin alert
3. `create_calendar_event(booking)` — Google Calendar
4. `add_contact_to_icloud(booking)` — iCloud contacts (deduped)

#### Rule 5: Log CRITICAL on any booking write failure

Any failed booking database operation must log with `logger.error(f"CRITICAL: ...")` so it can be monitored. Never swallow booking errors silently.

#### Rule 6: Booking collections are sacred

There are 3 booking collections. A booking must ALWAYS exist in exactly one of them:
- `db.bookings` — active bookings (shown in admin dashboard)
- `db.deleted_bookings` — soft-deleted bookings (recoverable)
- `db.bookings_archive` — archived completed bookings (7-year retention)

**NEVER** delete a booking from all three. **NEVER** have a code path where a booking exists in zero collections.

---

---

## QUALITY STANDARDS — STRICT, NON-NEGOTIABLE

This is a real business serving real customers paying real money. **Every single feature must work perfectly from start to finish.** No broken promises, no placeholder functionality, no "good enough". This is an honest business — if something is shown to the customer, it must actually work. If it doesn't work, remove it until it does.

**THE STANDARD: If a customer or admin interacts with ANY feature, it must work first try, every time.**

### 1. No Mock/Fake Functionality

- **NEVER** add console.log-only form submissions — every form MUST submit to a real backend endpoint
- **NEVER** show success toasts for operations that didn't actually succeed
- **NEVER** add placeholder handlers like "will be connected later" — connect it NOW or don't ship it
- Every button, form, and link must do what it says. If it says "Send Message", it must send the message.

### 2. No Misleading Claims

- **NEVER** claim "24/7 Support" unless there is an actual 24/7 support system (chat, phone, ticketing)
- "24/7 Service" (shuttle availability) is accurate and allowed — the service does run 24/7
- **NEVER** add testimonials, review counts, or statistics that aren't real
- **NEVER** show features as available when they aren't implemented

### 3. Customer-Facing Text Standards

- **NEVER** show technical terms to customers ("Stripe", "webhook", "API", database field names)
- Payment method "stripe" displays as "Credit/Debit Card" — ALWAYS
- Error messages must be helpful and human-readable, never stack traces or technical errors
- All customer emails must be professional, properly formatted, and contain accurate information

### 4. Every Payment Path Must Be Complete

ALL payment confirmation paths (Stripe webhook, Afterpay capture, polling, manual sync, SMS approval) MUST trigger all 4 post-payment actions:
1. `send_customer_confirmation(booking)`
2. `send_booking_notification_to_admin(booking)`
3. `create_calendar_event(booking)`
4. `add_contact_to_icloud(booking)`

No exceptions. If you add a new payment path, it must include all 4.

### 5. Webhook Idempotency Required

- Stripe webhooks can be retried — check if already processed before sending duplicate confirmations
- Check `payment_status == 'paid'` before triggering post-payment actions on repeat webhooks

### 6. Bulk Operations Must Be Safe

- Bulk delete/archive/restore MUST verify each record individually (per-record backup + find_one verification)
- **NEVER** use `delete_many()` after a batch `insert_one()` loop without per-record verification
- If any single record fails backup, skip it and continue — never delete unverified records

### 7. Field Name Consistency

- Payment status field: always `payment_status` (snake_case), NEVER `paymentStatus` (camelCase)
- Payment method field: always `payment_method` (snake_case) in database writes
- Be consistent — check existing field names before adding new update operations

### 8. Build Must Pass

- `cd frontend && npm run build` must succeed with zero errors before committing
- Fix unused imports, missing imports, and type errors immediately
- Never commit code that doesn't compile

### 9. Every UI Element Must Function

- **Google Maps autocomplete MUST show dropdown suggestions** — use portal-based `AddressAutocomplete` component (not inline absolute-positioned dropdowns that get clipped)
- **Customer search dropdown MUST work** — uses React Portal rendering to escape Dialog overflow constraints
- **Every dropdown, select, modal, and form input MUST be interactive and functional**
- **NEVER** use `position: absolute` for dropdowns inside scrollable containers — use React Portal (`ReactDOM.createPortal`) to render to `document.body`
- **NEVER** use `onBlur` with `setTimeout` to close dropdowns — use `pointerdown` event listeners on `document` for reliable close-on-outside-click
- All address inputs in BookNow.jsx MUST use the `AddressAutocomplete` component (portal-based, debounced, stale-request-safe)

### 10. Service Type Consistency

- Valid service types are: `airport-transfer` and `private-transfer`
- **NEVER** use `airport-shuttle` as a service type — the shuttle service has been removed
- This applies EVERYWHERE: frontend forms, backend endpoints, orphan recovery, CSV import, test data
- Check ALL files when changing service type values — they must be consistent across the entire codebase

### 11. Fix Bugs Immediately

- If you find a bug while working on something else, **fix it immediately** — do not leave it for later
- If a feature doesn't work end-to-end, it's not done — keep working until the full flow succeeds
- Test the complete user journey: form loads → user types → autocomplete appears → user selects → price calculates → booking submits → payment works → confirmation sends
- **NEVER** mark a task as complete if any part of the feature is broken

### 12. No Dead Links or Broken Navigation

- Every link must go somewhere real — no `href="#"` placeholders
- Every navigation item must lead to a working page
- Social media links must either point to real profiles or be removed entirely
- Footer links, header links, and in-page links must ALL work

---

## History of Production Breaks (why these rules exist)

| Date       | What broke                          | Root cause                              |
|------------|-------------------------------------|-----------------------------------------|
| 2026-03    | Admin dashboard crash               | FacebookTab used but never imported     |
| 2026-03    | Email sending crash potential        | SMTP fallback used MIMEMultipart/smtplib without importing them |
| Repeated   | Database connection failures         | Agents kept adding MongoDB references   |
| Repeated   | Email failures                       | Agents kept adding SendGrid/SMTP code   |
| 2026-03    | Duplicate flight sections in form    | Two separate flight detail sections confused customers |
| 2026-03-11 | Paid booking invisible in admin      | Pydantic validation silently dropped bookings with missing fields |
| 2026-03-11 | Admin panel cluttered/confusing      | Shuttle bookings merged into booking list without permission |
| 2026-03-11 | Bulk email broken                    | SMTP code in routes_bulk.py instead of Mailgun |
| 2026-03-13 | Shuttle polluting admin bookings      | Shuttle bookings mixed into main list; 68K line monolith |
| 2026-03-13 | Buttons unresponsive in admin         | Missing click targets, no stopPropagation on action buttons |
| 2026-03-13 | Orewa booking overcharged ($185)      | Google Maps API failed, 75km fallback used instead of 57.6km actual |
| 2026-03-21 | Google autocomplete dropdown invisible | BookNow.jsx used absolute-positioned dropdowns clipped by parent overflow |
| 2026-03-21 | Wrong service type across codebase    | `airport-shuttle` used in EditBookingModal, BookNow, orphan recovery, CSV import |
| 2026-03-21 | Multi-pickup fallback overcharging    | Fallback distance multiplied by pickup count (55km × 3 = 165km) |
| 2026-03-21 | CSV import wrong field names          | `paymentStatus` (camelCase) instead of `payment_status` (snake_case) |
| 2026-03-21 | Footer social links broken            | href="#" placeholders — links went nowhere |
| 2026-03-21 | Duplicate route unreachable page      | Two routes for same path, first match shadowed dedicated page |
| 2026-03-24 | Backend won't start on Render          | Smart/curly quotes (U+2018/U+2019) in server.py caused Python SyntaxError — invisible in editors, no agent caught it |
| 2026-03-24 | Maps diagnostic endpoint unreachable   | Backend crash meant new endpoint couldn't be tested — blocked debugging of month-old autocomplete issue |
| 2026-03-25 | Customer search dropdown blank in admin | `database.py` `_apply_project()` didn't handle exclusion-only projections |
| 2026-03-25 | Address autocomplete unselectable in admin dialogs | Radix Dialog dismissed on portal dropdown click — fixed with `elementFromPoint` |
| 2026-03-25 | 4 admin tabs invisible (Drivers, Applications, Analytics, Marketing) | Components built but no `TabsTrigger` buttons added |
| 2026-03-25 | Chatbot returned static text | Never wired to Claude API despite system prompt existing |
| 2026-03-25 | Fake testimonials and review counts across 30+ files | Fabricated stats violated honesty rules |
| 2026-03-25 | 20 ghost URLs in sitemap | Pages listed in `sitemap.xml` had no matching routes |
| 2026-03-25 | Open admin registration | `POST /api/admin/register` had no auth requirement |
