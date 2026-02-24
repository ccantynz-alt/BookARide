# BookARide — Claude Agent Context

## Project overview

BookARide is a New Zealand airport shuttle booking platform with a React frontend, FastAPI backend, and MongoDB database.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Radix UI / shadcn, Lucide React |
| Backend | Python 3, FastAPI, Pydantic v2 |
| Database | MongoDB (Motor async driver) |
| Maps / Geocoding | Geoapify (primary), Google Maps (legacy admin) |
| Payments | Stripe (card), Afterpay |
| Notifications | SendGrid (email), Twilio (SMS) |
| Calendar | Google Calendar API |
| Dev server | `craco start` (frontend), `uvicorn` (backend) |

## Brand colors

- **Gold:** `#D4AF37` — used as `text-gold`, `bg-gold`, `border-gold` via Tailwind config
- Glassmorphism direction: `bg-white/80 backdrop-blur-md`, `bg-white/60 backdrop-blur-sm`, soft border opacity

## Starting the dev environment

```bash
# Frontend (port 3000)
cd frontend && npm start

# Backend (port 8000)
cd backend && uvicorn server:app --reload

# Or from root
cd frontend && npm run start
```

## Key file map

| File | Purpose |
|---|---|
| `frontend/src/pages/BookNow.jsx` | Customer booking form — UX, pricing, form state |
| `frontend/src/pages/AdminDashboard.jsx` | Admin panel shell with tabs |
| `frontend/src/components/admin/ReturnsOverviewPanel.jsx` | Admin: return trips overview |
| `frontend/src/components/admin/UrgentReturnsPanel.jsx` | Admin: urgent departure alerts |
| `frontend/src/components/admin/TodaysOperationsPanel.jsx` | Admin: today's pickups |
| `frontend/src/components/GeoapifyAutocomplete.jsx` | Address autocomplete (NZ only) |
| `frontend/src/components/DateTimePicker.jsx` | Custom date/time pickers |
| `frontend/src/config/siteConfig.js` | Site name, contact info, feature flags |
| `frontend/src/config/api.js` | `API` base URL constant |
| `backend/server.py` | All API endpoints, booking logic, scheduled tasks |

## Booking form — important data flow

1. Customer fills `BookNow.jsx` form (`formData` state)
2. `handleSubmit()` validates then `POST /bookings`
3. `bookReturn: !!(returnDate && returnTime)` — computed, not stored in state
4. Backend saves to `bookings` collection; returns `referenceNumber`
5. Admin panels read `returnDate` + `returnTime` from DB to detect return trips

**Never rename or remove these `formData` fields** — they map 1:1 to the DB schema:
`returnDate`, `returnTime`, `returnDepartureFlightNumber`, `returnDepartureTime`, `returnArrivalFlightNumber`, `returnArrivalTime`

## Return journey — admin detection

- `ReturnsOverviewPanel`: `b.returnDate && b.returnTime && b.status !== 'cancelled'`
- `UrgentReturnsPanel`: polls `GET /admin/urgent-returns` every 5 min
- Backend scheduled task `check_return_booking_alerts()` fires SMS alerts every 15 min

## Service types

| Value | Label | Notes |
|---|---|---|
| `airport-shuttle` | Airport Shuttle | Flight fields shown + validated |
| `private-transfer` | Private Shuttle Transfer | No flight fields |

## Design system notes

- **Glassmorphism pattern:** `bg-white/80 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl`
- **Glassy sub-sections:** `bg-white/60 backdrop-blur-sm border border-gold/10 rounded-xl`
- **Soft admin cards:** `bg-white/90 backdrop-blur-sm border border-gray-100/80`
- **Input focus ring:** `focus:ring-2 focus:ring-gold/50 focus:border-gold/60`
- **Form section background:** `bg-gradient-to-br from-slate-100 via-white to-amber-50/30`

## Validation rules

- Return flight number **required** for `airport-shuttle` + return trip
- Booking date must not be in the past (NZ timezone)
- Bookings within 24 hours trigger manual approval flow

## Environment variables (frontend)

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEOAPIFY_API_KEY=...
REACT_APP_GOOGLE_MAPS_API_KEY=...   (optional, falls back to Geoapify)
REACT_APP_STRIPE_PUBLISHABLE_KEY=...
```
