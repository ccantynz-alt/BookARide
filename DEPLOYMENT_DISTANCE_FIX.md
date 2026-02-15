# Distance / 25km Fix – Deployment Required

The zone distance fixes (Hibiscus Coast 73km, Whangarei 182km, airport address normalization) are on branch `cursor/composer-1-5-compatibility-6130`.

**Render deploys from `main`.** To fix the 25km default on the live site:

1. **Merge to main:**
   ```bash
   git checkout main
   git merge cursor/composer-1-5-compatibility-6130
   git push origin main
   ```

2. **Trigger a redeploy** on Render (or wait for auto-deploy).

3. **Set `GEOAPIFY_API_KEY`** on Render so Geoapify routing is used instead of the 25km fallback.

4. **Set `BOOKINGS_NOTIFICATION_EMAIL=bookings@bookerride.co.nz`** for admin booking copies.
