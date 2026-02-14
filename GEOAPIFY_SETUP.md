# Geoapify Setup (Maps & Address Autocomplete)

Geoapify replaces Google Maps for address autocomplete and distance calculation. It's more affordable for typical usage.

## Environment Variables

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `REACT_APP_GEOAPIFY_API_KEY` | Your Geoapify API key |

### Backend (Render)

| Variable | Value |
|----------|-------|
| `GEOAPIFY_API_KEY` | Same Geoapify API key |

**Important:** Add both variables and redeploy. Without the frontend key, address autocomplete won't work. Without the backend key, the pricing fallback will be used.

## Where to Get Your Key

1. Sign up at [Geoapify](https://www.geoapify.com/)
2. Go to **Dashboard** → **API Keys**
3. Copy your key (or create one)

## What Uses Geoapify

- **Address autocomplete** – Pickup and drop-off fields on the booking form
- **Distance calculation** – Price calculation uses Geoapify Routing API

## Optional: Google Maps

If you still have `REACT_APP_GOOGLE_MAPS_API_KEY` set, the route map will use it. If not set, a simple route summary is shown instead of the interactive map. Address autocomplete and pricing use Geoapify regardless.
