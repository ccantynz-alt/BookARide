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

# === Browser-side Google Maps JS regression check (CLAUDE.md 6c) ===
# This is the #1 cause of customer pain since Nov 2025. Native Places
# Autocomplete locks the input field whenever the API key is invalid
# or restricted, breaking the booking form. Server-side autocomplete
# via /api/places/autocomplete is the LOCKED architecture.
GMAPS_JS_HITS=$(grep -rEn "maps\.googleapis\.com/maps/api/js|window\.google\.maps\.places\.Autocomplete|from ['\"]@react-google-maps/api['\"]|require\(['\"]@react-google-maps/api['\"]\)" \
  --include="*.js" --include="*.jsx" --include="*.html" \
  "$REPO_ROOT/frontend/src" "$REPO_ROOT/frontend/public" "$REPO_ROOT/frontend/index.html" \
  2>/dev/null | grep -v node_modules || true)
if [ -n "$GMAPS_JS_HITS" ]; then
  echo "  ‼ BROWSER-SIDE GOOGLE MAPS JS DETECTED — see CLAUDE.md section 6c"
  echo "  ‼ Google Maps JS in the browser is BANNED. It locks the input"
  echo "  ‼ field when the API key is invalid and breaks the booking form."
  echo "  ‼ Use /api/places/autocomplete (server-side) only."
  echo "$GMAPS_JS_HITS" | sed 's/^/      /'
  echo ""
else
  echo "  ✓ No browser-side Google Maps JS (locked decision 6c holding)"
  echo ""
fi

# === Banned package check (CLAUDE.md Zero Tolerance Forbidden List) ===
# These packages have all caused production breaks. They must never be
# in frontend/package.json or api/package.json.
BANNED_PKGS=""
for pkg in "@react-google-maps/api" "@vuer-ai/react-helmet-async" "react-slick" "slick-carousel" "react-leaflet" "leaflet" "moment" "lodash" "jquery" "aos" "@craco/craco" "react-scripts"; do
  if grep -qE "\"$pkg\"\s*:" "$REPO_ROOT/frontend/package.json" "$REPO_ROOT/api/package.json" 2>/dev/null; then
    BANNED_PKGS="${BANNED_PKGS}\n      ${pkg}"
  fi
done
if [ -n "$BANNED_PKGS" ]; then
  echo "  ‼ BANNED PACKAGE(S) IN package.json — see CLAUDE.md Forbidden List"
  printf "%b\n" "$BANNED_PKGS"
  echo "  ‼ Ask Craig to authorise 'npm uninstall <pkg>' before any other work."
  echo ""
else
  echo "  ✓ No banned packages in package.json"
  echo ""
fi

# === Dead-code regression: backend/ folder ===
# Frontend-only architecture (CLAUDE.md 0). The backend/ folder must
# never reappear — it was deleted along with the Render deployment.
if [ -d "$REPO_ROOT/backend" ]; then
  echo "  ‼ backend/ FOLDER DETECTED — see CLAUDE.md section 0 (Architecture)"
  echo "  ‼ This project is frontend-only. Add new endpoints under api/, never backend/."
  echo ""
fi

# === Render config files (CLAUDE.md Forbidden Locations) ===
RENDER_FILES=""
for f in render.yaml runtime.txt Procfile; do
  [ -f "$REPO_ROOT/$f" ] && RENDER_FILES="${RENDER_FILES} $f"
done
if [ -n "$RENDER_FILES" ]; then
  echo "  ‼ RENDER CONFIG FILE(S) DETECTED:${RENDER_FILES}"
  echo "  ‼ Render is dead. Delete these files — Vercel handles everything."
  echo ""
fi

# === Banned imports / env vars / URLs in source ===
# Mongo, SMTP/SendGrid, Geoapify, broken helmet fork, REACT_APP_ env
# pattern, Render backend URL.
BANNED_IMPORT_HITS=$(grep -rEn "from ['\"]motor|from ['\"]pymongo|MongoClient|MONGO_URL|require\(['\"]@sendgrid|require\(['\"]nodemailer|smtplib|MIMEMultipart|geoapify\.com|GEOAPIFY_API_KEY|@vuer-ai/react-helmet-async|onrender\.com|bookaride-backend|process\.env\.REACT_APP_" \
  --include="*.js" --include="*.jsx" --include="*.py" \
  "$REPO_ROOT/frontend/src" "$REPO_ROOT/api" \
  2>/dev/null | grep -v node_modules || true)
if [ -n "$BANNED_IMPORT_HITS" ]; then
  echo "  ‼ BANNED IMPORT / ENV / URL DETECTED — see CLAUDE.md Forbidden List"
  echo "$BANNED_IMPORT_HITS" | sed 's/^/      /'
  echo "  ‼ Replace before any other work."
  echo ""
else
  echo "  ✓ No banned imports / Render URLs / REACT_APP_ env vars"
  echo ""
fi

# === Banned API endpoint folders ===
# Shuttle, Xero, Afterpay, Facebook were all removed (CLAUDE.md 5, 6a, 6d, 7, 8).
BANNED_DIRS=""
for d in "api/shuttle" "api/xero" "api/afterpay" "api/facebook"; do
  [ -d "$REPO_ROOT/$d" ] && BANNED_DIRS="${BANNED_DIRS} $d/"
done
if [ -n "$BANNED_DIRS" ]; then
  echo "  ‼ BANNED API ENDPOINT FOLDER(S) DETECTED:${BANNED_DIRS}"
  echo "  ‼ Delete these folders — they are locked-removed features."
  echo ""
fi

# === airport-shuttle serviceType regression (CLAUDE.md sections 8, 9) ===
# Valid serviceTypes are airport-transfer and private-transfer ONLY.
# The route slug /airport-shuttle is a marketing URL and is allowed —
# this scan looks for the BANNED usage as a serviceType value only.
SHUTTLE_TYPE_HITS=$(grep -rEn "serviceType\s*[:=]\s*['\"]airport-shuttle['\"]|service_type\s*[:=]\s*['\"]airport-shuttle['\"]" \
  --include="*.js" --include="*.jsx" \
  "$REPO_ROOT/frontend/src" "$REPO_ROOT/api" \
  2>/dev/null | grep -v node_modules || true)
if [ -n "$SHUTTLE_TYPE_HITS" ]; then
  echo "  ‼ BANNED serviceType 'airport-shuttle' DETECTED — see CLAUDE.md 9"
  echo "  ‼ Valid serviceTypes: 'airport-transfer' and 'private-transfer' only."
  echo "$SHUTTLE_TYPE_HITS" | sed 's/^/      /'
  echo ""
else
  echo "  ✓ No banned 'airport-shuttle' serviceType usage"
  echo ""
fi

# === client-key.js wired to a frontend caller (CLAUDE.md 6c trap) ===
# /api/maps/client-key exposes the Google Maps API key to the browser.
# It is currently UNUSED. If a future agent wires it into a frontend
# loadGoogleMaps() helper, that re-introduces the banned native widget.
CLIENT_KEY_CALLERS=$(grep -rEn "maps/client-key|api/maps/client-key" \
  --include="*.js" --include="*.jsx" \
  "$REPO_ROOT/frontend/src" \
  2>/dev/null | grep -v node_modules || true)
if [ -n "$CLIENT_KEY_CALLERS" ]; then
  echo "  ‼ /api/maps/client-key NOW HAS A FRONTEND CALLER — CLAUDE.md 6c"
  echo "  ‼ This endpoint is intentionally unused. Wiring it up means a"
  echo "  ‼ frontend module is about to load Google Maps JS in the browser,"
  echo "  ‼ which is the #1 cause of booking form failures since Nov 2025."
  echo "$CLIENT_KEY_CALLERS" | sed 's/^/      /'
  echo ""
else
  echo "  ✓ /api/maps/client-key not wired to frontend (locked decision 6c holding)"
  echo ""
fi

# === Smart quotes in JS source ===
# Smart/curly quotes are invisible in most editors but break parsing
# in some toolchains. Caused a Python outage on 2026-03-24.
SMART_QUOTE_FILES=$(REPO_ROOT="$REPO_ROOT" python3 - <<'PY' 2>/dev/null || true
import os
hits = []
roots = [os.environ['REPO_ROOT'] + '/frontend/src',
         os.environ['REPO_ROOT'] + '/api']
for r in roots:
    for root, dirs, files in os.walk(r):
        if 'node_modules' in root: continue
        for f in files:
            if not f.endswith(('.js', '.jsx')): continue
            p = os.path.join(root, f)
            try:
                t = open(p, encoding='utf-8').read()
                if any(c in t for c in ['‘', '’', '“', '”']):
                    hits.append(p)
            except: pass
for h in hits[:10]: print(h)
PY
)
if [ -n "$SMART_QUOTE_FILES" ]; then
  echo "  ‼ SMART/CURLY QUOTES IN JS SOURCE — replace with ASCII"
  echo "$SMART_QUOTE_FILES" | sed 's/^/      /'
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
