# BookARide NZ — Agent Instructions

**READ THIS ENTIRE FILE BEFORE MAKING ANY CHANGES.**
**EVERY rule here exists because a previous agent broke production by ignoring it.**

---

## WHAT TO ASK CLAUDE — AUDIT LEVELS EXPLAINED

The owner is not a developer. When requesting work, use these phrases to get the right depth of checking:

| What You Say | What Claude Does | When To Use It |
|---|---|---|
| **"Fix this bug"** | Fixes the specific thing. Surface-level. | When you know exactly what's broken and just need it fixed |
| **"Audit this"** | Checks the area around the fix — imports, syntax, build. | Normal quality check |
| **"Deep audit" or "crawl this"** | Traces every code path end-to-end: button click → backend → database → email → customer. Finds silent failures like `run_async_task`. | When something "should work but doesn't" or when launching |
| **"Full site crawl"** | Audits EVERYTHING: every form, every endpoint, every email, every background task, every admin button. Multiple parallel agents. | Before launch, after major changes, or when multiple things are broken |

**RULE: If the owner says "it's not working" or "it's been broken for weeks" — ALWAYS do a deep audit, not a surface fix.** The bug that broke email notifications for a month passed every surface check (syntax OK, build OK, imports OK). Only tracing the actual execution path found it.

**RULE: Every agent session MUST run Step 5 (Deep Path Audit) from the Mandatory Checks if ANY booking, payment, or email code was changed — even if the change seems minor.**

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
| 8 | **Autonomous Testing** | After changes, verify everything still works. Run `npm run build`, check for banned imports. Production code is `frontend/` and `api/` ONLY — do NOT test `backend/` (legacy). |
| 9 | **Mandatory Documentation** | Every change gets documented so the next session knows what happened. Update CLAUDE.md if you add new rules, locked decisions, or break history. Commit messages must explain WHY, not just WHAT. |
| 10 | **Complete The Loop** | Every feature must work end-to-end. If it doesn't work from start to finish — form loads, user types, autocomplete appears, user selects, price calculates, booking submits, payment works, confirmation sends — it's not done. |

---

## LOCKED DECISIONS — DO NOT CHANGE, REVERT, OR "IMPROVE"

These decisions are FINAL. Do not introduce alternatives, fallbacks, or "improvements".

### 0. ABSOLUTE RULES — READ FIRST (2026-04-02)

**These rules exist because agents kept breaking working features with "improvements" and "optimizations".**

1. **If it works, DO NOT TOUCH IT.** No "performance optimizations" that risk hiding bookings. No "refactoring" of working code. No changing sort orders, limits, or query logic on working endpoints.
2. **NEVER paginate bookings.** `loadAllBookings` MUST be `true`. Setting it to `false` hid bookings and cost the business real money. ALL bookings must load. No limits, no pagination that hides data.
3. **NEVER change the bookings sort order** from `created_at DESC` without explicit owner approval. Text-based date sorting breaks with mixed date formats.
4. **ALL frontend files MUST use the centralized API config** — `import { API } from '../config/api'` or `'../../config/api'`. NEVER use `import.meta.env.VITE_BACKEND_URL` directly. This caused crashes on 8+ pages.
5. **Booking name field** — always resolve: `booking.name || (firstName + lastName) || 'Customer'`. NEVER assume firstName/lastName exist.
6. **Booking reference counter** — uses `id = 'booking_reference'` in the `counters` table with ON CONFLICT on the `id` column (which has a unique constraint). NEVER use ON CONFLICT on JSONB expressions.
7. **If you find a bug, fix it immediately.** Do not ask. Do not defer. Do not say "should I fix this?" — just fix it. The owner is not a developer and is paying for things to work.
8. **Every fix must be tested with `npm run build`** before pushing. No exceptions.
9. **NEVER introduce a change that reduces the number of visible bookings.** If a booking exists in the database, it MUST show in the admin panel. Missing bookings = lost revenue = business failure.

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

- Config: `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` env vars (set in Vercel)
- Sender module: `api/_lib/mailgun.js` (Mailgun HTTP API only) — production code
- **NEVER** add SendGrid, `smtplib`, `MIMEMultipart`, `MIMEText`, or SMTP code
- **NEVER** add `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars
- **NEVER** add "email fallback" logic — if Mailgun fails, log the error, that's it

### 3. Helmet: react-helmet-async (official)

- **NEVER** use `@vuer-ai/react-helmet-async` — it's a broken fork

### 4. Frontend: Vite + React (NOT CRA, NOT Next.js)

- Build: `vite build` (output to `build/` directory)
- Dev server: `vite` (port 3000, instant hot reload)
- The `@` alias is configured in `vite.config.js` → resolves to `src/`
- Environment variables use `VITE_` prefix (e.g., `VITE_BACKEND_URL`)
- **NEVER** use `process.env.REACT_APP_*` — use `import.meta.env.VITE_*`
- **NEVER** migrate to Next.js unless explicitly asked
- Migrated from CRA+CRACO to Vite on 2026-03-29 (10x faster builds, 1/5th the dependencies)

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

- Distance: `api/_lib/google-maps.js` (Distance Matrix + Directions API) — production code. `backend/server.py` is legacy.
- Config: `GOOGLE_MAPS_API_KEY` env var
- **NEVER** add Geoapify API calls, `GEOAPIFY_API_KEY`, or `geoapify.com` references
- **NEVER** add Geoapify as a "fallback" for Google Maps
- **NEVER** use Geoapify for address autocomplete or distance calculation

### 7. Pricing Rules — DO NOT CHANGE WITHOUT OWNER APPROVAL

These are the AUTHORITATIVE per-km rates. Calibrated so key routes price correctly (owner approved 2026-03-26).
Any agent that changes these rates without explicit owner instruction is breaking production pricing.

**Tiered Per-Kilometer Rates** (bracket-based — entire distance charged at ONE rate):

| From (km) | To (km) | Rate per km (NZD) |
|-----------|---------|-------------------|
| 0.1       | 15.0    | $12.00            |
| 15.0      | 15.8    | $8.00             |
| 15.8      | 16.0    | $6.00             |
| 16.0      | 25.5    | $5.50             |
| 25.5      | 35.0    | $5.00             |
| 35.0      | 50.0    | $3.13             |
| 50.0      | 60.0    | $2.60             |
| 60.0      | 75.0    | $2.84             |
| 70.0      | 100.0   | $2.70             |
| 100.0     | 300.0   | $3.50             |

**Note:** The 60-75 and 70-100 tiers overlap. The code uses `elif` chains so the 60-75 tier ($2.84) takes priority for distances 70-75 km. This matches the WordPress pricing plugin behavior (screenshot verified 2026-03-26).

**Code location**: `api/_lib/pricing.js` (tiered pricing in `calculatePrice` function) — this is the PRODUCTION pricing engine. `backend/server.py` is legacy and NOT deployed.

**Reference prices** (1 passenger, one-way, based on Google Maps distances):
- Gulf Harbour (~67 km): ~$190
- Orewa (~48 km): ~$150
- These are NOT flat prices — every address is different based on actual km

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

**Configuration (all in Vercel env vars):**
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

The system runs multiple AI-powered and scheduled automation agents. These are defined in the Vercel serverless functions (`api/`) and/or will be migrated to the V2 service when ready.

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

### 15. No Raw HTML Form Inputs — Use Custom Components ONLY (2026-04-03)

**Every form input in the entire codebase MUST use our custom components. NEVER use raw HTML `<input>` elements for dates, times, or any form field that has a custom component.**

This rule exists because agents repeatedly introduced raw `<input type="date">` and `<input type="time">` elements instead of using the existing `CustomDatePicker` and `CustomTimePicker` components. This causes inconsistent UI, timezone bugs, and a messy user experience across the admin panel.

**Mandatory components (defined in `frontend/src/components/DateTimePicker.jsx`):**
- **Dates:** `CustomDatePicker` — calendar popup with dd/MM/yyyy display, month/year dropdowns
- **Times:** `CustomTimePicker` — scrollable time selector with 15-minute intervals, 12-hour format
- **Date+Time:** `CustomDateTimePicker` — combined picker

**Rules:**
- **NEVER** use `<input type="date">` or `<Input type="date">` anywhere — use `CustomDatePicker`
- **NEVER** use `<input type="time">` or `<Input type="time">` anywhere — use `CustomTimePicker`
- **NEVER** use `.toISOString().split('T')[0]` for date handling — it returns UTC which is wrong for NZ (UTC+12/13). Use local date parsing instead
- Return date pickers MUST set `minDate` to the pickup date — users cannot book a return before departure
- Date range filters (e.g., admin bookings filter) MUST enforce that the end date >= start date
- When converting between Date objects and strings, use local year/month/day — never rely on UTC methods

**If you find ANY raw HTML date or time input while working, replace it with the custom component immediately.**

**Engineering Gap Scan addition — add this check to every session:**
```bash
# Check for raw HTML date/time inputs in frontend (should use CustomDatePicker/CustomTimePicker)
grep -rn 'type="date"\|type="time"' frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v DateTimePicker.jsx && echo "FAIL: Raw HTML date/time inputs found — use CustomDatePicker/CustomTimePicker" || true
```

---

## MANDATORY AUTOMATED CHECKS — RUN BEFORE EVERY COMMIT

**These checks are NON-NEGOTIABLE. Every agent session MUST run ALL of them before committing ANY code.**
**The owner is not a developer — agents are 100% responsible for code quality. No excuses.**

### Step 1: Engineering Gap Scan (run EVERY session, even if "not related" to your task)

Before starting work, scan for and fix existing issues. These are silent production killers:

```bash
# 1. Frontend build — this is the ONLY build that matters
cd frontend && npm run build

# 2. Check for banned imports/references in frontend and API
grep -rn "geoapify\|GEOAPIFY" frontend/src/ api/ && echo "FAIL: Geoapify references found" || true
grep -rn "airport-shuttle" frontend/src/ api/ && echo "FAIL: Removed service type 'airport-shuttle' found" || true
grep -rn "@vuer-ai/react-helmet-async" frontend/ && echo "FAIL: Broken helmet fork found" || true

# 3. No console.log in production frontend code
grep -rn "console\.log" frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v "// debug" || true

# 4. No raw HTML date/time inputs — must use CustomDatePicker/CustomTimePicker
grep -rn 'type="date"\|type="time"' frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v DateTimePicker.jsx && echo "FAIL: Raw HTML date/time inputs found — use CustomDatePicker/CustomTimePicker" || true
```

**If ANY of these fail, fix them IMMEDIATELY before doing anything else.**

**IMPORTANT: Do NOT run py_compile, do NOT check backend/*.py files. The Python backend is NOT production. Only `frontend/` and `api/` matter.**

### Step 2: Pre-Commit Verification (run before EVERY commit)

```bash
# 1. Frontend build — if ANY frontend or API file changed
cd frontend && npm run build

# 2. No broken imports — verify every React import resolves
# Check that imported components exist in the project

# 3. No console.log left in production code
grep -rn "console\.log" frontend/src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v "// debug" || true
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
4. **Verify deploy compatibility**: Will this work on Vercel? (Both frontend and API serverless functions deploy to Vercel.)

### Step 5: Deep Path Audit (run when ANY booking/payment/email code changes)

**This step catches the bugs that surface checks miss.** The `run_async_task` bug silently killed all background tasks for a month because no surface check would catch it — syntax was valid, imports existed, build passed. Only tracing the execution path reveals these killers.

**When to run:** Every time booking creation, payment processing, email sending, or background task code is changed. Also run at the START of any session where the owner reports "something isn't working."

**What to check:**

1. **Trace every background task from trigger to execution:**
   - Find every `background_tasks.add_task()` call in server.py
   - Verify the task function exists and has the correct signature
   - If the task is async, verify it runs on the MAIN event loop (not a new one)
   - If the task calls database operations, verify it uses the shared `db` connection pool
   - Check that errors in background tasks are LOGGED, not swallowed

2. **Trace every email from trigger to send:**
   - Pick any email-triggering action (booking creation, cancellation, reminder)
   - Follow the code: action → email function → HTML generation → Mailgun send
   - Verify every function in the chain EXISTS and is CALLABLE
   - Verify `email_wrapper()` is imported correctly where used
   - Check that email recipient addresses are not empty/None

3. **Trace every frontend submit from button to response:**
   - Follow: button click → handler → axios call → endpoint URL → backend handler → database write → response → UI update
   - Verify the endpoint URL matches a real route in server.py
   - Verify the payload fields match the Pydantic model
   - Verify the response is handled correctly (success AND error cases)
   - Check that no field is doubled, tripled, or lost in translation

4. **Check for silent failures:**
   - Search for `except: pass` or `except Exception: pass` — errors being swallowed
   - Search for `except` blocks that only log but don't re-raise critical errors
   - Check that every `try/except` in booking-critical paths has proper error handling
   - Verify that background task failures don't silently prevent customer notifications

5. **Check for event loop issues:**
   - Any use of `asyncio.new_event_loop()` is a RED FLAG — this creates a separate loop that can't access the main loop's database connections
   - Any use of `asyncio.run()` inside an already-running async context is a RED FLAG
   - Background tasks that are `async def` MUST be awaited, not run in a new loop

---

## PRE-CHANGE CHECKLIST

Before making ANY change, verify:

1. **Am I editing `backend/`?** **STOP.** That is legacy code — NOT production. Edit `frontend/` or `api/` only.
2. Does my change introduce MongoDB, Motor, or pymongo? **STOP.**
3. Does my change introduce SendGrid, SMTP, or smtplib? **STOP.**
4. Does my change introduce Geoapify or `GEOAPIFY_API_KEY`? **STOP.**
5. Does my change add a new import? **Verify the component/module exists first.**
6. Does my change remove or modify an existing import? **Verify nothing else uses it.**
7. Am I adding a new JSX component usage? **Add the import statement too.**
8. Does my build pass with `cd frontend && npm run build`? **Test before committing.**
9. If I changed pricing → did I edit `api/_lib/pricing.js`? (NOT `backend/server.py`)
10. Have I scanned for engineering gaps unrelated to my task? **Fix them too.**

---

## PRODUCTION ARCHITECTURE — VERCEL ONLY (2026-04-04)

**THE ENTIRE SITE RUNS ON VERCEL. THERE IS NO SEPARATE BACKEND SERVER.**

The Python `backend/` directory is LEGACY CODE — it is NOT deployed, NOT running, NOT production.
Render is NOT in use. There is NO Python backend in production.

**If you are about to edit a file in `backend/`, STOP. You are editing dead code that no customer will ever hit.**

### What IS Production

| Layer      | Tech                              | Location           |
|------------|-----------------------------------|--------------------|
| Frontend   | React 18, Vite, Tailwind          | `frontend/`        |
| API        | Vercel Serverless Functions (Node.js) | `api/`          |
| Pricing    | `api/_lib/pricing.js`             | The ONLY pricing engine |
| Email      | `api/_lib/mailgun.js`             | Mailgun HTTP API   |
| Database   | `api/_lib/db.js`                  | Neon PostgreSQL    |
| Maps       | `api/_lib/google-maps.js`         | Google Maps API    |
| Payments   | `api/payment/create-checkout.js`  | Stripe             |

### What is NOT Production

| Directory    | Status | Notes |
|-------------|--------|-------|
| `backend/`  | LEGACY — NOT DEPLOYED | Old Python/FastAPI code. Do NOT edit. Do NOT fix. Do NOT "improve". |
| `v2/`       | DEVELOPMENT — NOT DEPLOYED | Future rebuild. Work here only when explicitly told to. |

### Deployment

- **Vercel auto-deploys from `main` branch** — both frontend AND serverless API functions
- Every PR gets a Vercel preview URL for testing
- **NEVER push directly to main.** Always use a PR.
- There is NO Render deployment. There is NO separate backend to deploy.

### Pre-merge checklist (every PR)

1. Frontend builds: `cd frontend && npm run build` — zero errors
2. No banned imports (MongoDB, SendGrid, Geoapify, etc.)
3. Vercel preview URL was tested (forms load, autocomplete works, pricing calculates)
4. If pricing code changed → verify `api/_lib/pricing.js` has correct rates

### Post-deploy verification (after every merge to main)

1. Create a test booking on the live site
2. Verify confirmation email arrives
3. Verify admin notification arrives
4. Verify price is correct (including fuel surcharge)
5. If any of these fail → revert the merge immediately

### Environment Variables (Vercel)

**All credentials are configured in Vercel's Environment Variables settings.**
**NEVER** commit secrets to the repo.

Required (all set in Vercel):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Optional (but needed for full functionality, all set in Vercel):
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `VITE_BACKEND_URL` — should point to the same Vercel domain (self-referencing)

### API Serverless Functions (the REAL backend)

All API endpoints live in `api/` as Vercel serverless functions (Node.js):

| Endpoint | File | Purpose |
|----------|------|---------|
| `POST /api/calculate-price` | `api/calculate-price.js` | Pricing engine (uses `api/_lib/pricing.js`) |
| `POST /api/bookings` | `api/bookings.js` | Create booking |
| `GET /api/bookings` | `api/bookings.js` | List bookings (admin) |
| `POST /api/payment/create-checkout` | `api/payment/create-checkout.js` | Stripe checkout |
| `POST /api/webhook/stripe` | `api/webhook/stripe.js` | Stripe webhook |
| `POST /api/contact` | `api/contact.js` | Contact form |
| `POST /api/chatbot/message` | `api/chatbot/message.js` | AI chatbot |
| `POST /api/admin/login` | `api/admin/login.js` | Admin auth |
| `GET /api/places/autocomplete` | `api/places/autocomplete.js` | Google Places |

Shared libraries in `api/_lib/`:
- `db.js` — Neon PostgreSQL queries
- `pricing.js` — Pricing engine with tiered rates + fuel surcharge
- `mailgun.js` — Email sending (Mailgun only)
- `google-maps.js` — Distance calculation

### Fuel Surcharge (April 2026)

A 12% temporary fuel surcharge is active due to diesel increasing 85% in 28 days.
- `api/_lib/pricing.js` → `FUEL_SURCHARGE_PERCENT = 12`
- Frontend banner: `frontend/src/components/FuelSurchargeBanner.jsx`
- **To remove when fuel normalises:** set `FUEL_SURCHARGE_PERCENT = 0` in `api/_lib/pricing.js`

## Build & Test

```bash
# Frontend build (uses Vite — fast, ~8 seconds)
cd frontend && npm run build

# That's it. There is no backend to build or start.
# The API runs as Vercel serverless functions — no local server needed.
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

## TECHNOLOGY EXCELLENCE STANDARD — STRICT, NON-NEGOTIABLE

**BookARide must be 80-90% more advanced than competitors in every technical aspect.** This is a strict instruction from the owner. The economy is tough — we cannot afford to lose a single customer to poor technology.

### ABSOLUTE RULE: Only the Most Advanced Technology — No Exceptions (2026-03-29)

**We only use the most advanced, modern, production-proven technology available. Period.**

This applies to EVERY domain, EVERY component, EVERY library, EVERY pattern in the entire codebase — frontend, backend, emails, APIs, everything. If something is old, outdated, deprecated, or has a better modern replacement — rip it out and replace it immediately.

**Specific mandates:**
- **No raw HTML pages** — everything is React components with Tailwind CSS. HTML is only acceptable inside email templates (email clients require it) and the root `index.html` entry point
- **No jQuery or jQuery-era libraries** — no AOS, no Slick Carousel, no Bootstrap, no Lodash (use native JS)
- **No deprecated React patterns** — no class components (except ErrorBoundary), no `componentDidMount`, no `this.state`, no `.then()` chains
- **No deprecated build tools** — we use Vite (NOT CRA, NOT Webpack directly, NOT Parcel)
- **No deprecated Node packages** — if `npm audit` flags it or the package README says "deprecated," replace it
- **Always use the latest stable version** of every dependency — not bleeding edge (avoid .0 releases), but current stable
- **Proactively upgrade** — every session, check if key dependencies have newer versions. If a better library exists for what we're doing, flag it and replace it
- **Code-split everything** — lazy load pages, use dynamic imports, keep initial bundle small
- **Performance is mandatory** — if a page loads slowly, fix it. If a component re-renders unnecessarily, fix it. If an API call is slow, fix it

**What "most advanced" means in practice:**
| Category | What We Use | What Is Banned |
|----------|-------------|----------------|
| Build tool | Vite | CRA, Webpack, Parcel, Rollup (standalone) |
| UI framework | React 18+ with hooks | Class components, jQuery, vanilla JS DOM manipulation |
| Styling | Tailwind CSS | Bootstrap, Material UI, styled-components, inline `style={{}}` |
| Components | Radix UI (headless) | jQuery UI, Ant Design, old Material UI |
| Animation | Framer Motion | AOS, jQuery animate, CSS-only hacks |
| Carousel/Slider | Embla Carousel or CSS Grid | react-slick, Slick Carousel, Swiper (jQuery-based) |
| Icons | Lucide React | Font Awesome, Material Icons, icon fonts |
| Charts | Recharts | Chart.js, D3 (unless absolutely needed) |
| API client | Axios with async/await | fetch without error handling, XMLHttpRequest |
| Forms | Controlled components + React Hook Form | Uncontrolled inputs, Formik (maintenance mode) |
| Maps | Google Maps API | Leaflet, Mapbox (unless Google fails) |
| Routing | React Router v7 | Reach Router, older React Router versions |
| State | React hooks (useState, useContext) | Redux (overkill for this app), MobX |
| Email | Mailgun HTTP API (HTML templates) | SMTP, SendGrid, raw nodemailer |
| Backend/API | Vercel Serverless Functions (Node.js) | Python backend (legacy), Flask, Django, Express |
| Database | Neon PostgreSQL | MongoDB, SQLite, MySQL |
| AI | Claude API (Anthropic) | OpenAI, GPT, Gemini |

**If you encounter ANY old, deprecated, or substandard technology while working — replace it immediately. Do not leave it for later. Do not mark it as "tech debt." Fix it now.**

### Rules:

1. **Use the most advanced, production-proven technologies available.** If a better library, framework pattern, or API exists for what we are building — use it. Do not settle for "good enough" when "best in class" is available.

2. **Every feature must be bulletproof.** No half-measures, no "it mostly works", no "edge case we can fix later." If a customer touches it, it must work perfectly the first time, every time. Zero tolerance for broken flows.

3. **Every scheduled task, background job, and automation must have safeguards.** Duplicate prevention, status checks, cancellation awareness, error logging, and graceful degradation. No silent failures. No spam. No emails to customers who have cancelled.

4. **Proactively upgrade and improve.** If you see outdated patterns, inefficient code, or substandard implementations while working on a task — flag it and fix it. Do not leave technical debt for the next session.

5. **The customer experience is sacred.** Every interaction (booking form, email, SMS, payment, chatbot) must feel professional, polished, and reliable. We represent a premium service — the technology must match.

6. **No embarrassing failures.** Sending emails to cancelled customers, broken forms, unresponsive buttons, placeholder content, fake data — these destroy trust instantly. Every agent session must actively hunt for and eliminate these issues.

### Known Issue Fixed (2026-03-27): Email Reminders to Cancelled Customers

The AI email support system was only FLAGGING cancellations (setting `cancellation_requested: True`) but NOT actually changing the booking status to `cancelled`. This meant all scheduled email systems (reminders, post-trip thank-yous, payment follow-ups) kept emailing customers who had cancelled. Fixed by:
- AI cancellation now sets `status: "cancelled"` immediately
- ALL scheduled email queries now exclude `cancellation_requested: True` as a safety net
- `send_post_trip_email()` now checks both status and `cancellation_requested` flag
- `auto_complete_past_bookings()` now excludes cancellation-requested bookings

**RULE: Every query that sends emails to customers MUST exclude both `status: 'cancelled'` AND `cancellation_requested: True`. No exceptions.**

---

## CLAUDE-ONLY DEVELOPMENT — NO EXCEPTIONS (2026-03-29)

**From this point forward, ALL code changes to BookARide are made by Claude only.** No other AI agents, no human developers, no freelancers. This rule exists because too many hands have introduced inconsistent patterns, sloppy code, and production-breaking bugs since November 2025.

### Rules:

1. **Claude is the sole developer.** Every line of code in this repository is Claude's responsibility. If it's broken, Claude fixes it. If it's sloppy, Claude cleans it. No excuses about "someone else wrote that."

2. **Clean as you go.** Every file Claude touches gets brought up to standard. If you see old patterns, dead code, commented-out blocks, unused imports, or sloppy logic — clean it up in the same session. Don't leave it for next time.

3. **No legacy excuses.** "That was already there" is not acceptable. If it's bad code and you're in the file, fix it. The goal is to systematically bring the entire codebase to professional standard, one session at a time.

4. **Consistent patterns everywhere.** All React components use functional components with hooks. All styling uses Tailwind CSS. All API calls use axios with proper error handling. All state management uses React hooks (useState, useEffect, useContext). No mixing of patterns.

---

## CUSTOMER ERROR SHIELD — MANDATORY (2026-03-29)

**Customers must NEVER see raw errors, technical messages, stack traces, or broken UI.** Every error must be caught and translated into a friendly, helpful message before it reaches the customer. This is a two-layer system: the code tries to work correctly (layer 1), and if it fails, the customer sees a polished error message (layer 2).

### Architecture (already implemented):

| Layer | Component | What It Does |
|-------|-----------|--------------|
| 1 | `RootErrorBoundary` | Catches any unhandled React crash — shows friendly "something went wrong" page with reload button |
| 2 | `AdminErrorBoundary` | Same but for admin dashboard — shows "try again" or "back to login" |
| 3 | `window.onerror` + `window.onunhandledrejection` | Global catch-all in `index.js` for errors that happen before React loads |
| 4 | `NotFound.jsx` | Friendly 404 page for bad URLs |
| 5 | Toast notifications (`sonner`) | Every API call shows success/error toasts — never raw error objects |
| 6 | BookNow.jsx error handling | Specific friendly messages: "Cannot reach server", "Please check addresses", etc. |

### Rules:

1. **Every API call MUST have a try/catch** with a user-friendly error message in the catch block. Never let `error.message` or `error.response.data` reach the UI directly without sanitising it first.

2. **Never show technical terms to customers.** No "500 Internal Server Error", no "TypeError", no "undefined is not a function", no "NetworkError", no database field names, no "Stripe" branding. Translate everything.

3. **Error messages must be helpful.** Not just "Something went wrong" — tell the customer what to do: "Unable to calculate price. Please check your addresses and try again." or "Payment service temporarily unavailable. Please try again in a few minutes."

4. **API errors must return clean JSON.** Every serverless function in `api/` must catch exceptions and return `{"detail": "Human-readable message"}` — never raw stack traces.

5. **Loading states for everything.** Every button that triggers an API call must show a loading spinner or "Processing..." state. No buttons that appear to do nothing when clicked. No double-submission.

6. **Graceful degradation.** If Google Maps is down, show a message instead of breaking the form. If Stripe is down, still create the booking and tell the customer "we'll send you a payment link by email." If email fails, log it and don't crash the booking.

---

## MODERN CODE STANDARDS — MANDATORY (2026-03-29)

**Every piece of code in this project must follow modern best practices. No exceptions.**

### Frontend (React):

| Pattern | Required | Banned |
|---------|----------|--------|
| Components | Functional components with hooks | Class components (except ErrorBoundary — React requires it) |
| State | `useState`, `useEffect`, `useContext`, `useRef` | `this.state`, `componentDidMount`, `componentWillReceiveProps` |
| Styling | Tailwind CSS utility classes | Inline `style={{}}` objects (except dynamic values like calculated widths) |
| API calls | `axios` with async/await in try/catch | Raw `fetch()` without error handling, `.then()` chains |
| Forms | Controlled components with state | Uncontrolled inputs, `document.getElementById` |
| Dropdowns in modals | React Portal (`ReactDOM.createPortal`) | `position: absolute` inside scrollable containers |
| Imports | Named imports, tree-shakeable | `import *`, wildcard imports |
| Variables | `const` and `let` | `var` |
| Console | `console.error` in catch blocks only | `console.log` in production code (remove before commit) |

### API Serverless Functions (Node.js — `api/`):

**This is the production backend. NOT `backend/`.**

| Pattern | Required | Banned |
|---------|----------|--------|
| Runtime | Node.js (Vercel serverless) | Python backend (legacy, not deployed) |
| Database | `api/_lib/db.js` (Neon PostgreSQL) | Motor, pymongo, MongoDB anything |
| Email | `api/_lib/mailgun.js` (Mailgun HTTP API) | SMTP, SendGrid, smtplib |
| Pricing | `api/_lib/pricing.js` | Editing `backend/server.py` (not production) |
| Error handling | `try/catch` with `console.error()` | Silent swallowing of errors |
| Secrets | Vercel environment variables | Hardcoded strings, committed `.env` files |

### Code Cleanup Checklist (run on every file you touch):

1. Remove unused imports
2. Remove commented-out code blocks
3. Remove dead functions/components that nothing calls
4. Replace `var` with `const`/`let`
5. Replace inline styles with Tailwind classes (where practical)
6. Add error handling to any API call missing it
7. Remove `console.log` statements (keep `console.error` in catch blocks)
8. Ensure consistent field naming (snake_case for database, camelCase for React props)

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
| 2026-03-27 | Cancelled customers receiving constant emails | AI email cancellation only flagged bookings, never changed status to cancelled — all scheduled jobs kept emailing them |
| 2026-04-01 | Vercel build failure on main | Broken AdminLogin.jsx — `<a>` closed with `</div>`, undefined GOOGLE_GIS_SCRIPT constant |
| 2026-04-01 | Admin login always failing | Vercel serverless login.js read `admin.password` instead of `admin.hashed_password` + no pbkdf2 support |
| 2026-04-01 | Payment links returning errors | Vercel serverless returned `checkout_url` but frontend expected `url` field |
| 2026-04-01 | Payment follow-up emails wrong URL | Sent customers to `/book-now` instead of `/pay/{bookingId}` |
| 2026-04-01 | 8 pages crashing with "undefined/api" | Direct `import.meta.env.VITE_BACKEND_URL` usage instead of centralized API config |
| 2026-04-01 | Admin dashboard crash on edit modal close | `clearEditAddressSuggestions()` called but never defined |
| 2026-04-02 | Bookings hidden by pagination | "Performance optimization" set loadAllBookings=false, limit=50 — hid bookings including paid ones |
| 2026-04-02 | Booking #149 invisible | Date sort used text comparison on mixed formats (YYYY-MM-DD vs DD/MM/YYYY) — misclassified as past |
| 2026-04-02 | Reference number #14271 instead of sequential | Counter used ON CONFLICT on JSONB expression with no unique constraint — fell back to COUNT(*) |
| 2026-04-02 | "Name: undefined undefined" in admin emails | Email template assumed firstName/lastName but customer submitted single name field |
| 2026-04-02 | Customers tab crash | CustomersTab.jsx used broken VITE_BACKEND_URL directly + /api/customers endpoint missing |
| 2026-04-03 | Messy date/time inputs in admin forms | EditBookingModal used raw `<input type="date/time">` instead of CustomDatePicker/CustomTimePicker — inconsistent UI, timezone bugs, no return date validation |

---

## V2 STRATEGY — LOCKED (2026-04-02)

**BookARide is moving to a complete V2 rebuild.** The current v1 codebase has been damaged by too many hands since November 2025. V2 will be built by Claude only, from scratch.

### V2 Architecture Plan

- **V2 development happens in the `/v2` directory** — NEVER touch the v1 production code in the main directories unless fixing critical bugs
- **Database is PRESERVED** — the Neon PostgreSQL database is shared between v1 and v2. NO data loss. NO migration needed.
- **V2 will replace V1 only when fully tested and complete** — swap happens by changing Vercel build directory, not by deleting v1
- **AI-Intelligent Backend Service** — custom-built, owned by BookARide, not dependent on third-party hosting quirks
- **AI-Intelligent Frontend Service** — first of its kind, fully integrated with the backend
- **eSIM Integration** — customers can purchase eSIMs before entering NZ, added to booking cost, available immediately. Coming within 1 week. This has never been done before in the transfer industry.

### V2 Technology Rules

- **Claude-only development** — no other AI, no agencies, no freelancers
- **No HTML pages** — everything is React components with Tailwind CSS (email templates are the only exception)
- **Most advanced production-proven technology only** — see the Technology Excellence Standard section
- **Every component must work end-to-end before shipping** — no placeholder functionality
- **Backend must be self-hosted/owned** — not dependent on any single hosting provider's proprietary features
| 2026-03-27 | Cancelled customers receiving constant emails | AI email cancellation only flagged bookings, never changed status to cancelled — all scheduled jobs kept emailing them |
