#!/bin/bash
# BookARide NZ — Session Start Hook
#
# This hook runs at the start of every Claude Code session.
# It installs all dependencies so tests, linters, and builds work
# without manual setup.
#
# It also prints a loud reminder that CLAUDE.md is THE BIBLE and
# must be read in full before any code changes.
#
# This hook is enforced by .claude/settings.json (SessionStart event).

set -euo pipefail

# Only run in remote (Claude Code on the web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$REPO_ROOT"

echo "================================================================"
echo "  BookARide NZ — SessionStart Hook"
echo "================================================================"
echo ""

# === Mandatory CLAUDE.md acknowledgement ===
if [ -f "CLAUDE.md" ]; then
  CLAUDE_MD_LINES=$(wc -l < CLAUDE.md)
  echo "  ⚠  CLAUDE.md is THE BIBLE for this project"
  echo "  ⚠  ${CLAUDE_MD_LINES} lines of locked decisions and rules"
  echo "  ⚠  READ IT IN FULL BEFORE TOUCHING ANY CODE"
  echo "  ⚠  Ignoring CLAUDE.md has cost Craig months of revenue"
  echo ""
  echo "  Required reading on every new session:"
  echo "    1. Session Start Protocol (lines 9-23)"
  echo "    2. Strict Market Domination Rules (lines 25-92)"
  echo "    3. Craig's Authorization Gate (search 'CRAIG'S AUTHORIZATION')"
  echo "    4. Major Change Protocol"
  echo "    5. Zero Tolerance Forbidden List"
  echo "    6. All Locked Decisions (sections 0-14)"
  echo ""
fi

# === Roadmap (paused / authorised work that must not be forgotten) ===
if [ -f ".claude/ROADMAP.md" ]; then
  ROADMAP_LINES=$(wc -l < .claude/ROADMAP.md)
  echo "  📋 .claude/ROADMAP.md exists (${ROADMAP_LINES} lines)"
  echo "     Contains paused but Craig-authorised work — READ IT"
  echo "     before starting anything new. Do not resume paused"
  echo "     work without Craig's explicit go-ahead."
  echo ""
fi

# === Install frontend dependencies (Vite + React) ===
if [ -f "frontend/package.json" ]; then
  echo "  Installing frontend dependencies..."
  cd "$REPO_ROOT/frontend"
  npm install --legacy-peer-deps --no-audit --no-fund --silent 2>&1 | tail -3 || {
    echo "  ⚠  Frontend npm install had warnings — check output above"
  }
  echo "  ✓ Frontend ready"
  echo ""
fi

# === Install Vercel serverless API dependencies ===
if [ -f "$REPO_ROOT/api/package.json" ]; then
  echo "  Installing API serverless dependencies..."
  cd "$REPO_ROOT/api"
  npm install --no-audit --no-fund --silent 2>&1 | tail -3 || {
    echo "  ⚠  API npm install had warnings — check output above"
  }
  echo "  ✓ API ready"
  echo ""
fi

cd "$REPO_ROOT"

# === Verify build still passes ===
echo "  Verifying frontend build..."
cd "$REPO_ROOT/frontend"
if npm run build > /tmp/bookaride-build.log 2>&1; then
  echo "  ✓ Frontend builds cleanly"
else
  echo "  ‼ FRONTEND BUILD FAILED — see /tmp/bookaride-build.log"
  tail -20 /tmp/bookaride-build.log
fi
echo ""

cd "$REPO_ROOT"

# === Quick syntax check on all serverless API functions ===
echo "  Checking API serverless function syntax..."
API_ERRORS=0
while IFS= read -r jsfile; do
  if ! node --check "$jsfile" 2>/dev/null; then
    echo "  ‼ Syntax error in: $jsfile"
    API_ERRORS=$((API_ERRORS + 1))
  fi
done < <(find "$REPO_ROOT/api" -name "*.js" -not -path "*/node_modules/*" -type f)

if [ "$API_ERRORS" -eq 0 ]; then
  echo "  ✓ All API serverless functions parse cleanly"
else
  echo "  ‼ ${API_ERRORS} API file(s) have syntax errors"
fi
echo ""

# === Email architecture regression check (CLAUDE.md section 6e) ===
# Three Google Workspace mailboxes, locked architecture. Catch the
# common drift modes:
#   - Customer template starts inviting replies again
#   - Hardcoded default in API code stops being bookings@bookaride.co.nz
#   - Customer-facing pages send users at bookings@ instead of info@
EMAIL_ISSUES=""

# 1. "reply to this email" wording in customer templates
if grep -lE "(reply to this email|just reply|respond to this message)" \
     "$REPO_ROOT/api/_lib/email-templates.js" \
     2>/dev/null | grep -q .; then
  EMAIL_ISSUES="${EMAIL_ISSUES}\n   - Customer template invites reply (must say 'do not reply, contact info@')"
fi

# 2. Default admin recipient must remain bookings@bookaride.co.nz
WRONG_DEFAULT=$(grep -rEn "BOOKINGS_NOTIFICATION_EMAIL\s*\|\|\s*['\"](?!bookings@bookaride\.co\.nz)" \
  --include="*.js" "$REPO_ROOT/api" 2>/dev/null | grep -v node_modules || true)
if [ -n "$WRONG_DEFAULT" ]; then
  EMAIL_ISSUES="${EMAIL_ISSUES}\n   - BOOKINGS_NOTIFICATION_EMAIL fallback is no longer 'bookings@bookaride.co.nz':\n${WRONG_DEFAULT}"
fi

# 3. Customer-facing pages must point support links at info@, not bookings@
CUSTOMER_FACING_BOOKINGS=$(grep -rln "bookings@bookaride\.co\.nz" \
  "$REPO_ROOT/frontend/src/pages/PayNow.jsx" \
  "$REPO_ROOT/frontend/src/pages/Contact.jsx" \
  "$REPO_ROOT/frontend/src/components/Footer.jsx" \
  "$REPO_ROOT/frontend/src/components/RootErrorBoundary.jsx" \
  "$REPO_ROOT/frontend/src/pages/seo/" \
  2>/dev/null || true)
if [ -n "$CUSTOMER_FACING_BOOKINGS" ]; then
  EMAIL_ISSUES="${EMAIL_ISSUES}\n   - Customer-facing page exposes bookings@ (should be info@):\n${CUSTOMER_FACING_BOOKINGS}"
fi

if [ -n "$EMAIL_ISSUES" ]; then
  echo "  ‼ EMAIL ARCHITECTURE REGRESSION — see CLAUDE.md section 6e"
  printf "%b\n" "$EMAIL_ISSUES" | sed 's/^/  /'
  echo "  ‼ Fix in your first commit of the session."
  echo ""
else
  echo "  ✓ Email architecture intact (CLAUDE.md 6e holding)"
  echo ""
fi

# === Afterpay regression check ===
# Craig has had Afterpay reintroduced multiple times by previous
# sessions. Fail loudly at session start if anything Afterpay related
# leaked back into the repo. See CLAUDE.md section 6d.
AFTERPAY_HITS=$(grep -rli "afterpay" \
  --include="*.js" --include="*.jsx" --include="*.json" \
  --include="*.html" --include="*.xml" --include="*.css" \
  "$REPO_ROOT/frontend/src" "$REPO_ROOT/api" \
  2>/dev/null | grep -v node_modules || true)
if [ -n "$AFTERPAY_HITS" ]; then
  echo "  ‼ AFTERPAY REGRESSION DETECTED — see CLAUDE.md section 6d"
  echo "  ‼ Afterpay was nuked on 2026-04-25 and must NOT come back."
  echo "  ‼ Files containing 'afterpay':"
  echo "$AFTERPAY_HITS" | sed 's/^/      /'
  echo "  ‼ Delete these references in your first commit of the session."
  echo ""
else
  echo "  ✓ No Afterpay references (locked decision 6d holding)"
  echo ""
fi

# === Final reminder ===
echo "================================================================"
echo "  Setup complete. REMEMBER:"
echo "  - CLAUDE.md is THE BIBLE — read it before touching anything"
echo "  - Major changes require Craig's explicit authorization"
echo "  - Frontend-only architecture: NO backend/ folder"
echo "  - Stripe is the ONLY payment method (CLAUDE.md 6d)"
echo "  - Run /api/health/booking-system before claiming bookings work"
echo "================================================================"
