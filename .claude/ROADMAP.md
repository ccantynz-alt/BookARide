# BookARide — Claude Roadmap

> **Read this file at the start of every Claude session.**
> It captures work that Craig has authorised but paused, so
> nothing gets lost between sessions. When work resumes,
> start here, then re-read CLAUDE.md, then ask Craig before
> touching anything.

---

## Active pause reasons

- 2026-04-14 — Craig paused Flywheel development to handle a
  higher-priority issue. He said *"I'll be back to you soon"*.
  Do NOT proactively resume Flywheel work — wait for Craig to
  explicitly ask.

---

## AUTHORISED but PAUSED — The Flywheel System

**Authorisation date:** 2026-04-14
**Authorisation phrasing:** *"Please go ahead and proceed and
finish all stages"* — followed minutes later by *"actually let's
pause development"*. The authorisation stands; only the timing
is paused.

### Context (what Craig asked for)

Craig wants a flywheel system that remembers and learns from
every Claude conversation so the product gets smarter over time.
He said he's willing to wait 20 minutes at session start if
that's what it takes to load the right context. He wants
"machine learning" and "every keystroke recorded."

### What Claude proposed (and Craig authorised)

Four stages. Each delivers standalone value and ships in its
own focused commit. Do NOT skip stages or merge them — the
whole point of staging is that Craig can veto between each one.

#### Stage 1 — Session Memory (the foundation)

**New tables in Neon Postgres** (migration via
`CREATE TABLE IF NOT EXISTS`, run on first hook call):

- `claude_sessions` — one row per Claude session: id, started_at,
  ended_at, branch, user_goal, summary, outcome
  (shipped / blocked / needs-followup), commits made, files
  touched, tools used
- `claude_session_events` — one row per significant event:
  tool call, message, commit, CI result, authorisation
  request. The "flight recorder."
- `claude_session_feedback` — Craig's thumbs-up / thumbs-down
  on any decision, with reason

**New Vercel serverless endpoints:**
- `POST /api/claude/memory/start` — session-start hook calls
  this, gets back a session_id + the memory briefing
- `POST /api/claude/memory/end` — session-end hook calls this,
  server uses Haiku to write a structured summary from events
  and git log, updates the session row
- `GET  /api/claude/memory/briefing` — returns the formatted
  briefing for a given branch + task
- `POST /api/claude/memory/event` — log a single event during
  a session (optional during-session logging)

**Hook changes:**
- `.claude/hooks/session-start.sh` — extended to POST to
  `/api/claude/memory/start` with branch name, receive the
  briefing, dump it to a file Claude reads on startup
- `.claude/hooks/session-end.sh` — new bash script that POSTs
  to `/api/claude/memory/end` with the session_id
- `.claude/settings.json` — add SessionEnd hook registration

**Auth:** shared secret `CLAUDE_MEMORY_SECRET` in the
Authorization header. If the env var is not set, endpoints
accept any request (degraded mode for bootstrap).

**No frontend changes in Stage 1.**

#### Stage 2 — Pattern Library (compound learning)

**New table:** `claude_patterns` — id, description, source
(session_ids), proposed_rule_text, status
(proposed / approved / rejected), craig_feedback, created_at

**New cron** (add to `vercel.json`): weekly on Sunday 08:00
NZ time (20:00 UTC Saturday). Path:
`/api/cron/weekly-patterns`.

**New endpoints:**
- `api/cron/weekly-patterns.js` — runs the extractor
- `api/claude/patterns/index.js` — GET list, POST create
- `api/claude/patterns/[patternId].js` — POST approve/reject

**New admin page:** `frontend/src/pages/admin/ClaudePatterns.jsx`
— list proposed patterns, approve/reject buttons, preview of
the resulting CLAUDE.md edit.

**Behaviour:** Claude Haiku analyses the last 7 days of
`claude_sessions` + `claude_session_events`, finds recurring
issues, proposes new CLAUDE.md rules. Emails Craig a summary
with a link to the admin page. Approved patterns get auto-
merged into CLAUDE.md (via git commit with an authorisation
log trail).

#### Stage 3 — Semantic Recall (the real compound intelligence)

**Database:**
- Enable `pgvector` extension on Neon (free, built-in — just
  `CREATE EXTENSION IF NOT EXISTS vector;`)
- Add `embedding vector(1024)` column to `claude_sessions` and
  `claude_patterns` tables

**New integration:** Voyage AI for embeddings.
**NEEDS CRAIG'S EXPLICIT SIGN-OFF** at Stage 3 time — Anthropic
doesn't provide embeddings but recommends Voyage as their
partner. Craig has "Anthropic only" as the rule for LLMs; he
needs to confirm Voyage is acceptable for the distinct
embeddings primitive.

**New env var:** `VOYAGE_API_KEY` — Craig needs to add this
to Vercel when Stage 3 starts.

**New files:**
- `api/_lib/embeddings.js` — Voyage AI client (with graceful
  keyword-search fallback if `VOYAGE_API_KEY` is not set)
- `api/claude/memory/embed.js` — compute embedding for a
  given session_id or pattern_id
- `api/cron/backfill-embeddings.js` — one-time job to embed
  all historical sessions and patterns

**Behaviour:** On new session start, Claude embeds the first
user message, runs a vector similarity search across all
historical sessions + patterns, loads the top 5–10 most
relevant items into the briefing. Not just "last 10 sessions"
— the 10 MOST RELEVANT sessions to the task at hand.

#### Stage 4 — Feedback Loop (the ratchet)

**New endpoint:** `POST /api/claude/feedback` — records
thumbs-up / thumbs-down on a session / commit / decision with
optional reason text.

**New admin page:**
`frontend/src/pages/admin/ClaudeSessions.jsx` — list recent
sessions with thumb buttons and a text field for reasons.
Entries Craig thumbs-down surface a warning in the next
session's briefing.

**Retrieval weighting:** positive feedback boosts a memory's
rank in Stage 3's semantic search; negative feedback either
demotes or (if severe) adds a "don't do this" banner to the
briefing.

---

## Things Craig REJECTED — do NOT build

- **Keystroke logging.** Replaced with full CLAUDE interaction
  logging (messages, tool calls, commits, CI results). Never
  log raw keystrokes.

## Things still needing Craig's explicit confirmation

- **Voyage AI for embeddings** — at Stage 3 start. If Craig
  says no, fall back to keyword / full-text search on
  Postgres `tsvector` columns — less intelligent but purer
  stack.

---

## Order of work when resuming

1. Re-read CLAUDE.md in full (always)
2. Re-read this ROADMAP.md
3. Check `git log -20` for anything that changed while paused
4. Ask Craig before starting Stage 1 — confirm it's still the
   priority
5. Build Stage 1 as a single focused commit
6. **STOP** and let Craig verify on the Vercel preview before
   moving to Stage 2
7. Repeat for Stages 2, 3, 4

Never skip "STOP and let Craig verify" between stages. The
whole point of staging is that each stage ships + earns its
trust before the next one starts.
