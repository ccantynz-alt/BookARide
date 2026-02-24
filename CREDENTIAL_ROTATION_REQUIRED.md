# URGENT: Google Service Account Credential Rotation Required

## ⚠️ Security Alert

A Google Cloud service account private key was previously committed to this repository at `backend/service_account.json`. While the file has been removed from the current branch, it still exists in the Git history.

## Immediate Actions Required

### 1. Rotate the Service Account Key (CRITICAL - Do This First)

**You must immediately disable the exposed service account key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Find the service account: `bookaride-calendar-service@bookaride-calenda-integration.iam.gserviceaccount.com`
4. Click on the service account
5. Go to the "Keys" tab
6. Find the key with ID: `410c5efbc470818a466d68da59c8b22139da586f`
7. Click the three dots menu → **Delete**
8. Create a new key:
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the new key file
   - Save it as `backend/service_account.json` (this path is now in .gitignore)

### 2. Review Service Account Permissions

While rotating the key, review what permissions this service account has:

1. In the service account details, check "Permissions" tab
2. Review all roles assigned to this account
3. Apply the principle of least privilege - remove unnecessary permissions
4. Check Cloud Audit Logs for any suspicious activity using the old key

### 3. Update Environment Configuration

After creating the new service account key:

```bash
# Ensure the new key is properly placed
mv ~/Downloads/bookaride-*.json backend/service_account.json

# Verify it's gitignored
git status  # Should NOT show service_account.json
```

### 4. Remove from Git History (Repository Owner)

The exposed credential still exists in Git history. To completely remove it:

**Option A: Using BFG Repo-Cleaner (Recommended)**

```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh mirror
git clone --mirror https://github.com/ccantynz-alt/BookARide.git

# Remove the file from all commits
cd BookARide.git
bfg --delete-files service_account.json

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ DESTRUCTIVE - coordinate with team)
git push --force
```

**Option B: Using git-filter-repo**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove the file from history
git filter-repo --path backend/service_account.json --invert-paths

# Force push
git push --force --all
```

**⚠️ Warning**: Force pushing rewrites history. Coordinate with all team members before doing this.

### 5. Verify Removal

After cleaning history:

```bash
# Search entire git history for the project ID
git log --all --source --full-history -- '*service_account.json'

# Should return no results
```

### 6. Monitor for Unauthorized Access

For the next 30 days:

1. Monitor Google Cloud Audit Logs for the project `bookaride-calenda-integration`
2. Look for any API calls made with the old service account
3. Check for unusual calendar access or modifications
4. Review any Google Workspace admin logs if applicable

## What Was Exposed?

The committed file contained:

- **Service Account Email**: `bookaride-calendar-service@bookaride-calenda-integration.iam.gserviceaccount.com`
- **Private Key**: Full RSA private key for authentication
- **Project ID**: `bookaride-calenda-integration`
- **Client ID**: `107548937180223732630`

Anyone with repository access could have used this key to impersonate your service account and access Google Calendar APIs or other Google services this account has permissions for.

## Prevention Measures Now in Place

This repository now has multiple layers of protection:

1. ✅ `.gitignore` updated with comprehensive patterns for credential files
2. ✅ Pre-commit hooks configured (Gitleaks, detect-secrets, detect-private-key)
3. ✅ GitHub Actions secret scanning on every push
4. ✅ `SECURITY.md` with credential management guidelines
5. ✅ `service_account.json` explicitly gitignored

## Future Best Practices

### For Google Cloud Service Accounts:

1. **Never commit service account JSON files**
2. Store them locally in gitignored paths only
3. Use Google Cloud Secret Manager for production deployments
4. Rotate service account keys every 90 days
5. Use workload identity federation when possible instead of service account keys

### For All Credentials:

1. Always use environment variables
2. Enable pre-commit hooks before making commits
3. Use secret management services (Google Secret Manager, AWS Secrets Manager, etc.)
4. Review all files before committing
5. Never bypass pre-commit hooks unless absolutely necessary

## Need Help?

If you need assistance with:
- Rotating the service account key
- Removing credentials from Git history
- Setting up the new authentication

Contact the repository owner immediately.

---

**Created**: February 17, 2026  
**Status**: ⚠️ CREDENTIAL ROTATION REQUIRED
