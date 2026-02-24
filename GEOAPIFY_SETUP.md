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
- **Route map** – Interactive map with route preview (when `REACT_APP_GEOAPIFY_API_KEY` is set)

## Map Display

- **Google Maps key set** → Uses Google Maps for the route preview
- **Geoapify key set (no Google)** → Uses Geoapify map tiles + routing for the route preview
- **Neither set** → Simple text route summary
