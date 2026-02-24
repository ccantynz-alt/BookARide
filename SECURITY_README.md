# Credential Protection System

This directory contains comprehensive credential protection for BookARide to prevent secrets from being exposed in GitHub.

## 🚨 Urgent Security Alerts

If you're here because of a security alert, start here:

1. **Google Service Account Exposed** → Read `CREDENTIAL_ROTATION_REQUIRED.md`
2. **Emergent API Key Exposed** → Read `EMERGENT_API_KEY_ROTATION_REQUIRED.md`
3. **Any Other Credential** → Read `SECURITY.md` → "What to Do If You Accidentally Commit a Secret"

## 📚 Documentation

### For All Developers

- **[DEVELOPER_SECURITY_GUIDE.md](DEVELOPER_SECURITY_GUIDE.md)** - Complete guide to working with the security system
  - Pre-commit hooks setup and usage
  - How to handle secrets properly
  - Common scenarios and solutions
  - Troubleshooting

### For Security and Operations

- **[SECURITY.md](SECURITY.md)** - Comprehensive security policy
  - Credential management best practices
  - Environment variable templates
  - What never to commit
  - Incident response procedures

### For Emergency Response

- **[CREDENTIAL_ROTATION_REQUIRED.md](CREDENTIAL_ROTATION_REQUIRED.md)** - Google Service Account rotation
- **[EMERGENT_API_KEY_ROTATION_REQUIRED.md](EMERGENT_API_KEY_ROTATION_REQUIRED.md)** - Emergent API key rotation

## 🛡️ Protection Layers

### Layer 1: .gitignore
Files automatically excluded from git:
- `.env`, `.env.*` (all environment files)
- `service_account.json` and variants
- `*credentials.json`, `*token.json`
- Private keys (`.key`, `.pem`, `id_rsa*`)
- Backup files (`*.bak`)

### Layer 2: Pre-Commit Hooks
Runs before every commit:
- ✅ Detects private keys
- ✅ Scans for API keys and secrets (Gitleaks)
- ✅ Detects high-entropy strings (detect-secrets)
- ✅ Blocks large files (>500KB)
- ✅ Prevents commits to main/master

**Setup**: `pip install pre-commit && pre-commit install`

### Layer 3: GitHub Actions
Runs on every push:
- ✅ Gitleaks - comprehensive secret scanning
- ✅ TruffleHog - verified secret detection
- ✅ Scans entire commit history

**Location**: `.github/workflows/secret-scanning.yml`

### Layer 4: Custom Rules
Custom patterns for BookARide-specific secrets:
- MongoDB connection strings
- JWT secret keys
- Stripe API keys (`sk_live_*`, `pk_*`)
- Google API keys (`AIza...`)
- Twilio keys (`SK...`)
- Mailgun keys (`key-...`)
- Emergent API keys (`sk-emergent-...`)

**Configuration**: `.gitleaks.toml`

## 🚀 Quick Start for Developers

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/ccantynz-alt/BookARide.git
cd BookARide

# 2. Install pre-commit
pip install pre-commit
pre-commit install

# 3. Set up environment variables
cp SECURITY.md backend/.env.example
# Edit backend/.env with your actual credentials
nano backend/.env

# 4. Verify .gitignore is working
git status  # Should NOT show .env files
```

### Daily Workflow

```bash
# Make changes to code
vim backend/server.py

# Stage changes
git add backend/server.py

# Commit (pre-commit hooks run automatically)
git commit -m "Add new feature"
# ✅ All checks pass → commit succeeds
# ❌ Secret detected → commit blocked, fix the issue

# Push
git push
# GitHub Actions will scan for secrets
```

### If Pre-Commit Fails

```bash
# Example error:
# Finding: api_key="sk-live-abc123"

# 1. Remove hardcoded secret
# Change: api_key = "sk-live-abc123"
# To:     api_key = os.environ.get('STRIPE_API_KEY')

# 2. Add to backend/.env
echo 'STRIPE_API_KEY=sk-live-abc123' >> backend/.env

# 3. Try again
git commit -m "Add new feature"
```

## 📋 Checklist for Safe Development

- [ ] Pre-commit hooks installed (`pre-commit install`)
- [ ] Environment files created (`backend/.env`, `frontend/.env`)
- [ ] Environment files NOT committed (check `git status`)
- [ ] All API keys use `os.environ.get()` or `process.env.REACT_APP_*`
- [ ] Service account JSON saved locally but NOT committed
- [ ] No hardcoded credentials in code
- [ ] Tested commits trigger pre-commit hooks

## 🔍 Testing the Protection

### Test .gitignore

```bash
# Create a test env file
echo "SECRET_KEY=test123" > backend/.env

# Check git status
git status
# Should show: "nothing to commit, working tree clean"

# Clean up
rm backend/.env
```

### Test Pre-Commit Hooks

```bash
# Run all hooks on all files
pre-commit run --all-files

# Should see:
# check for added large files..............Passed
# detect private key.......................Passed
# check for merge conflicts................Passed
# check yaml...............................Passed
# check json...............................Passed
# don't commit to branch...................Passed
# Detect secrets...........................Passed
# Detect hardcoded secrets.................Passed
```

### Test Gitleaks

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks/releases

# Scan current files
gitleaks detect --source . --config .gitleaks.toml --no-git

# Should report any detected secrets
```

## 🎯 Common Scenarios

### Adding New API Integration

1. Add environment variable to code:
   ```python
   NEW_API_KEY = os.environ.get('NEW_API_KEY')
   if not NEW_API_KEY:
       logging.warning("NEW_API_KEY not set")
   ```

2. Document in `SECURITY.md`

3. Add detection rule in `.gitleaks.toml`

4. Test with pre-commit hooks

### Rotating Exposed Credential

1. **Immediately** revoke the exposed credential in the service
2. Generate a new credential
3. Update `backend/.env` locally
4. Update production environment variables
5. Remove from code if hardcoded
6. Clean Git history (see emergency response docs)

### Onboarding New Developer

1. Share `DEVELOPER_SECURITY_GUIDE.md`
2. Have them install pre-commit hooks
3. Share `.env.example` or `SECURITY.md` template
4. **DO NOT** send actual credentials via email/Slack
5. Use secure credential sharing (1Password, LastPass, etc.)

## 📖 File Reference

### Configuration Files

- `.gitignore` - Files excluded from git
- `.pre-commit-config.yaml` - Pre-commit hook configuration
- `.gitleaks.toml` - Gitleaks secret detection rules
- `.github/workflows/secret-scanning.yml` - GitHub Actions workflow

### Documentation Files

- `SECURITY.md` - Main security policy
- `DEVELOPER_SECURITY_GUIDE.md` - Developer guide
- `CREDENTIAL_ROTATION_REQUIRED.md` - Google service account rotation
- `EMERGENT_API_KEY_ROTATION_REQUIRED.md` - Emergent API rotation
- `SECURITY_README.md` - This file

### Template Files

- `backend/service_account.json.example` - Service account template

## ⚠️ Important Notes

### What's Protected

✅ Credentials added **after** this system was implemented
✅ New commits are automatically scanned
✅ Pull requests trigger secret scanning

### What's NOT Protected

❌ Secrets already in Git history before this system
❌ Secrets in other branches not yet scanned
❌ Credentials sent via other channels (email, Slack, etc.)

### Limitations

- Pre-commit hooks can be bypassed with `--no-verify`
- `.gitignore` doesn't remove files already committed
- GitHub Actions only run when you push
- False positives can occur (e.g., example keys in docs)

## 🆘 Getting Help

1. **Read the docs** (especially `DEVELOPER_SECURITY_GUIDE.md`)
2. **Check the examples** in documentation files
3. **Test locally** before pushing
4. **Contact repository owner** for:
   - Credential rotation assistance
   - Force-push coordination (history cleanup)
   - Production environment variable updates

## 📊 System Status

✅ **Active Protection Layers**: 4
✅ **Pre-Commit Hooks**: Installed and tested
✅ **GitHub Actions**: Configured and active
✅ **Known Exposures**: Documented with rotation instructions
✅ **Developer Guide**: Available
✅ **Security Policy**: Documented

---

**Last Updated**: February 17, 2026
**System Version**: 1.0
**Status**: ✅ Fully Operational
