# Distance / 25km Fix – Deployment Required

## Root Cause
When Geoapify and Google Maps APIs fail (or API keys are not set), the system used to fall back to **25km** – causing massive undercharging for 60–70km trips (e.g. Orewa/Hibiscus Coast to Airport).

## Fixes Applied
1. **Fallback increased from 25km to 75km** – When both APIs fail, we now use 75km instead of 25km to avoid undercharging long trips.
2. **Zone minimums expanded** – Hibiscus Coast (73km), North Auckland/Warkworth (65km), Hamilton (125km), Whangarei (182km).
3. **More Hibiscus Coast keywords** – orewa beach, stillwater, coatesville.

## CRITICAL: Set API Keys in Production
**Render deploys from `main`.** To get accurate pricing (not the 75km fallback):

1. **Set `GEOAPIFY_API_KEY`** on Render – Primary routing API.
2. **Set `GOOGLE_MAPS_API_KEY`** on Render – Fallback when Geoapify fails.

Without these, the system uses 75km as a conservative default (better than the old 25km, but still not ideal).

3. **Set `BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz`** for admin booking copies.
