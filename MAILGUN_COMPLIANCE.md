# Mailgun compliance – credentials removed from repo

Per Mailgun Compliance (Jennifer Ross), all **API keys and literal credentials** have been removed from the repository.

## What was done in this repo

- **No hardcoded Mailgun API keys**  
  Scripts and docs now use environment variables only (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `SENDER_EMAIL`).
- **Files updated**
  - `check_mailgun_dns.py` – reads from env
  - `final_comprehensive_test.py` – reads from env
  - `backend_test.py` – reads from env
  - `TEST_EMAIL_WHEN_READY.md` – example uses `os.environ.get("MAILGUN_API_KEY")`, no literal key

The file **EMAIL_SYSTEM_READY.md** (which previously contained credentials at an old commit) is not present in the current tree.

## What you still need to do

1. **Rotate the exposed API key in Mailgun**
   - Mailgun Dashboard → [Rotate API keys](https://documentation.mailgun.com/en/latest/api-intro.html#rotating-api-keys).
   - **Delete** the key ending in `235e4bb2-1ecf548a` (as requested by Mailgun).
   - Create a **new** API key and set it only in your **environment** (e.g. Render dashboard, backend `.env` on server, or CI secrets). Never commit the new key.

2. **Reply to Mailgun**
   - Reply to Jennifer | Mailgun Compliance Operations.
   - Confirm that:
     - All references to API keys have been removed from the repo.
     - The old key has been deleted and a new key created and stored only in environment/config (not in the repo).

3. **Optional: purge old commits from history**
   - A new commit does **not** remove the key from **past** commits. If the repo stays public, consider purging history:
     - [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
     - Or use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) / `git filter-repo` to replace the key string in history, then force-push (coordinate with any collaborators).

## Keeping keys safe going forward

- Store **MAILGUN_API_KEY**, **MAILGUN_DOMAIN**, **SENDER_EMAIL** only in:
  - Server `.env` (and ensure `.env` is in `.gitignore`)
  - Render/Vercel/CI environment variables
- Never paste API keys, SMTP passwords, or account passwords into Markdown, code, or comments.
