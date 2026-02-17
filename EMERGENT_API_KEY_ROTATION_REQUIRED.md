# URGENT: Emergent API Key Rotation Required

## ⚠️ Critical Security Alert

A hardcoded Emergent API key was found in the repository at `backend/server.py` (lines 3253, 3566, and 4380).

**Exposed Key**: `sk-emergent-1221fFe2cB790B632B`

This key has been **REMOVED** from the code and replaced with an environment variable, but it still exists in:
- Git commit history
- Backup files (`.bak` files)

## Immediate Actions Required

### 1. Rotate the Emergent API Key (CRITICAL - Do This First)

**You must immediately revoke and replace the exposed API key:**

1. Log in to your Emergent integration dashboard
2. Navigate to API Keys or Settings
3. Find the key ending in `...B632B`
4. **Revoke/Delete** the key immediately
5. Generate a new API key
6. Add it to your environment:

```bash
# In backend/.env (this file is gitignored)
EMERGENT_API_KEY=your_new_key_here
```

### 2. Update Production Environment

If this application is deployed to production:

1. **Render/Vercel/Your hosting platform**:
   - Go to environment variables settings
   - Add `EMERGENT_API_KEY` with the new value
   - Redeploy the application

### 3. Remove Backup Files with Exposed Key

The old key still exists in backup files:

```bash
# From the repository root
cd /home/runner/work/BookARide/BookARide

# Find and remove backup files containing the old key
git rm backend/*.bak
git commit -m "Remove backup files with exposed credentials"
git push
```

### 4. Clean Git History (Repository Owner)

The exposed key still exists in Git history. To completely remove it, follow the instructions in `CREDENTIAL_ROTATION_REQUIRED.md` to use BFG Repo-Cleaner or git-filter-repo.

**Search pattern to remove**:
```
sk-emergent-1221fFe2cB790B632B
```

### 5. Verify the Fix

After updating the environment variable:

```bash
# Test that the application starts
cd backend
python start.py

# Check logs - should NOT show "EMERGENT_API_KEY not set" warning
```

## What Was Exposed?

The hardcoded API key was used for:
- Email response generation (LLM-powered customer service)
- Language translation features
- AI-powered conversation features

Anyone with repository access could have used this key to:
- Make API calls to Emergent services
- Potentially incur costs on your Emergent account
- Access or modify LLM integration features

## Changes Made

1. ✅ Removed hardcoded `sk-emergent-1221fFe2cB790B632B` from `backend/server.py`
2. ✅ Added `EMERGENT_API_KEY` environment variable
3. ✅ Updated all 3 occurrences to use the environment variable
4. ✅ Added warning message if `EMERGENT_API_KEY` is not set
5. ✅ Updated `SECURITY.md` documentation
6. ✅ Added detection rule in `.gitleaks.toml` for `sk-emergent-*` pattern

## Testing After Rotation

After rotating the key and updating the environment:

1. Test email response generation
2. Test translation features
3. Monitor Emergent API usage for next 24-48 hours
4. Check for any unauthorized API calls

## Prevention

These changes prevent future exposures:
- Pre-commit hooks will catch hardcoded `sk-emergent-*` patterns
- GitHub Actions will scan for API keys on every push
- `.gitignore` now includes `*.bak` files
- Documentation updated with proper credential management

## Need Help?

If you need assistance with:
- Rotating the Emergent API key
- Setting up the environment variable
- Cleaning Git history

Contact the repository owner immediately.

---

**Created**: February 17, 2026  
**Status**: ⚠️ IMMEDIATE ACTION REQUIRED - Rotate Emergent API key
