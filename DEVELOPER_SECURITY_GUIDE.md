# Developer Guide: Credential Security

This guide explains how to work with the credential protection systems in place for BookARide.

## Quick Start

### For New Developers

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ccantynz-alt/BookARide.git
   cd BookARide
   ```

2. **Install pre-commit hooks** (one-time setup):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

3. **Set up environment variables**:
   
   Create `backend/.env`:
   ```bash
   # Copy from SECURITY.md and fill in real values
   MONGO_URL=your_mongodb_url
   DB_NAME=bookaride
   JWT_SECRET_KEY=your_secret_key
   EMERGENT_API_KEY=your_emergent_key
   # ... etc
   ```

4. **Verify setup**:
   ```bash
   # This should show nothing to commit (env files are gitignored)
   git status
   ```

## Pre-Commit Hooks

Every time you commit, the following checks run automatically:

### What Gets Checked

1. **Large Files** - Prevents files over 500KB
2. **Private Keys** - Blocks RSA/EC/DSA private keys
3. **Merge Conflicts** - Detects unresolved merge markers
4. **YAML Syntax** - Validates YAML files
5. **JSON Syntax** - Validates JSON files
6. **Branch Protection** - Prevents direct commits to main/master
7. **Detect Secrets** - Scans for high-entropy strings (potential secrets)
8. **Gitleaks** - Comprehensive secret scanning with custom rules

### If Pre-Commit Fails

**Example failure**:
```
Detect hardcoded secrets.................................................Failed
- hook id: gitleaks
- exit code: 1

Finding: api_key="sk-live-abc123..."
```

**What to do**:
1. **Remove the secret** from your code
2. **Add it to environment variables** instead:
   ```python
   # ❌ BAD
   api_key = "sk-live-abc123..."
   
   # ✅ GOOD
   api_key = os.environ.get('STRIPE_API_KEY')
   ```
3. Add the environment variable to `backend/.env` (gitignored)
4. Commit again - the hooks will pass

### Bypassing Hooks (Emergency Only)

If you're **absolutely certain** a detection is a false positive:

```bash
git commit --no-verify -m "your message"
```

⚠️ **Use with extreme caution!** This bypasses all security checks.

## GitHub Actions Secret Scanning

When you push to any branch, GitHub Actions runs:

### Automatic Scans

1. **Gitleaks** - Scans entire commit history
2. **TruffleHog** - Additional secret verification

### If Actions Fail

You'll see a failed check on your PR. Click "Details" to see:
- What secret was detected
- In which file
- At which line number

**Fix it**:
1. Remove the secret from the file
2. Add to environment variables
3. Force push the corrected commit
4. If in history, see "Cleaning Git History" below

## What NOT to Commit

### Never Commit These Files

- ❌ `.env` files
- ❌ `service_account.json`
- ❌ `*_credentials.json`
- ❌ `*_token.json`
- ❌ Private keys (`.key`, `.pem`, `id_rsa`)
- ❌ Files with API keys or passwords

### These Are Safe (Examples/Templates)

- ✅ `.env.example`
- ✅ `service_account.json.example`
- ✅ Documentation with placeholders (`your_key_here`)

## Common Scenarios

### Scenario 1: Adding a New API Integration

**Need**: Add Stripe integration requiring an API key

**Steps**:
1. Add to environment:
   ```python
   # backend/server.py
   STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
   if not STRIPE_API_KEY:
       logging.warning("STRIPE_API_KEY not set")
   ```

2. Document in `SECURITY.md`:
   ```markdown
   # Payment Processing
   STRIPE_API_KEY=your_stripe_key_here
   ```

3. Add detection rule in `.gitleaks.toml`:
   ```toml
   [[rules]]
   id = "stripe-api-key"
   description = "Stripe API Key"
   regex = '''(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}'''
   ```

4. Test locally - the pre-commit hook should catch hardcoded keys

### Scenario 2: Working with Google Service Account

**Need**: Use Google Calendar API

**Steps**:
1. Download `service_account.json` from Google Cloud Console
2. Save to `backend/service_account.json` (automatically gitignored)
3. Code uses it directly:
   ```python
   credentials = service_account.Credentials.from_service_account_file(
       'backend/service_account.json'
   )
   ```
4. **Never commit** this file
5. Provide `service_account.json.example` as a template

### Scenario 3: Accidentally Committed a Secret

**Oh no! You just committed an API key!**

**If not pushed yet**:
```bash
# Undo the commit (keeps your changes)
git reset HEAD~1

# Remove the secret from your files
# Add to environment variables instead

# Commit again (hooks will catch it if still present)
git commit -m "Your message"
```

**If already pushed**:
1. **Immediately rotate the credential** in the service (Stripe, Google, etc.)
2. Remove from code and use environment variables
3. Contact repository owner for history cleanup
4. See `CREDENTIAL_ROTATION_REQUIRED.md` for detailed instructions

## Cleaning Git History

If secrets made it into Git history, they must be completely removed.

### Using BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh mirror
git clone --mirror https://github.com/ccantynz-alt/BookARide.git

# Remove the secret (replace with your actual secret)
cd BookARide.git
bfg --replace-text <(echo 'sk-live-abc123==>REMOVED')

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ coordinate with team first!)
git push --force
```

### Using git-filter-repo

```bash
pip install git-filter-repo

# Remove a specific file from all history
git filter-repo --path backend/service_account.json --invert-paths

# Force push
git push --force --all
```

## Environment Variables Reference

### Required for Backend

```bash
# Database
MONGO_URL=mongodb://...
DB_NAME=bookaride

# Authentication
JWT_SECRET_KEY=your_secret_key

# Google Services
GOOGLE_MAPS_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# Payment
STRIPE_API_KEY=your_key

# Communication
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=your_domain

# LLM Integration
EMERGENT_API_KEY=your_emergent_key
```

### Required for Frontend

```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_key
```

## Testing Your Setup

### Test Pre-Commit Hooks

```bash
# Run all hooks on all files
pre-commit run --all-files

# Run a specific hook
pre-commit run detect-secrets --all-files
pre-commit run gitleaks --all-files
```

### Test Gitleaks Locally

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from GitHub releases

# Scan current files
gitleaks detect --source . --config .gitleaks.toml --no-git

# Scan entire git history
gitleaks detect --source . --config .gitleaks.toml
```

### Verify .gitignore

```bash
# Create a test .env file
echo "API_KEY=test" > backend/.env

# Check git status - should NOT show .env
git status
# Should show "nothing to commit, working tree clean"

# Clean up
rm backend/.env
```

## FAQ

### Q: Pre-commit hooks are slowing me down

**A**: Hooks only run on staged files, not your entire repository. They typically complete in 1-3 seconds for small commits.

### Q: Can I disable hooks temporarily?

**A**: Yes, but **only for testing**:
```bash
pre-commit uninstall  # Disable
pre-commit install    # Re-enable
```

Better: Skip for one commit:
```bash
git commit --no-verify -m "message"
```

### Q: What if I need to commit a file that looks like a secret but isn't?

**A**: Add it to the allowlist in `.gitleaks.toml`:
```toml
[allowlist]
paths = [
  '''path/to/false/positive\.py$'''
]
```

### Q: How do I rotate all credentials?

**A**: See detailed instructions in:
- `CREDENTIAL_ROTATION_REQUIRED.md` (Google service account)
- `EMERGENT_API_KEY_ROTATION_REQUIRED.md` (Emergent API)
- `SECURITY.md` (general credential management)

### Q: The GitHub Action is failing but pre-commit passed

**A**: GitHub Actions scan the **entire repository history**, while pre-commit only scans **new changes**. A secret may be in an old commit.

## Getting Help

1. **Check documentation**:
   - `SECURITY.md` - Comprehensive security guidelines
   - `CREDENTIAL_ROTATION_REQUIRED.md` - Emergency response for exposed Google credentials
   - `EMERGENT_API_KEY_ROTATION_REQUIRED.md` - Emergency response for exposed Emergent key

2. **Common issues**:
   - Pre-commit failing → Remove the detected secret, use environment variables
   - GitHub Action failing → Check action logs for which file/line
   - Can't push → Likely a secret in history, need to clean

3. **Contact**:
   - Repository owner for credential rotation help
   - Repository owner for force-push coordination (history cleanup)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing!
