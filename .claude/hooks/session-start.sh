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

# === Final reminder ===
echo "================================================================"
echo "  Setup complete. REMEMBER:"
echo "  - CLAUDE.md is THE BIBLE — read it before touching anything"
echo "  - Major changes require Craig's explicit authorization"
echo "  - Frontend-only architecture: NO backend/ folder"
echo "  - Run /api/health/booking-system before claiming bookings work"
echo "================================================================"
