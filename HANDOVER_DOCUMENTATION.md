# BookaRide NZ - Complete System Handover Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Features Overview](#features-overview)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Third-Party Integrations](#third-party-integrations)
9. [Admin Panel Guide](#admin-panel-guide)
10. [Environment Variables](#environment-variables)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

BookaRide NZ is a full-stack airport transfer and shuttle booking system built for New Zealand operations. It handles customer bookings, driver management, payment processing, SMS/email notifications, and Google Calendar integration.

**Live Production:** bookaride.co.nz
**International Site:** bookaridenz.com

---

## Tech Stack

### Frontend
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** React hooks (useState, useEffect)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Date Picker:** react-datepicker
- **Animations:** Framer Motion
- **Maps:** Google Maps API (@react-google-maps/api)
- **Notifications:** react-hot-toast

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (via Motor async driver)
- **Authentication:** JWT tokens
- **Task Scheduler:** APScheduler
- **Email:** Mailgun API
- **SMS:** Twilio API
- **Payments:** Stripe API
- **Calendar:** Google Calendar API
- **AI:** OpenAI GPT (via emergentintegrations)

### Infrastructure
- **Container:** Docker/Kubernetes
- **Process Manager:** Supervisor
- **Frontend Port:** 3000
- **Backend Port:** 8001

---

## Architecture

```
/app
├── backend/
│   ├── server.py           # Main FastAPI application (monolithic)
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn components
│   │   │   ├── ExitIntentPopup.jsx
│   │   │   ├── DateTimePicker.jsx
│   │   │   └── ...
│   │   ├── pages/        # Page components
│   │   │   ├── BookNow.jsx          # Customer booking form
│   │   │   ├── AdminDashboard.jsx   # Admin panel
│   │   │   ├── DriverDashboard.jsx  # Driver portal
│   │   │   └── ...
│   │   ├── App.js        # Main app with routing
│   │   └── index.js      # Entry point
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment variables
│
├── HANDOVER_DOCUMENTATION.md  # This file
├── DEPLOYMENT_CHECKLIST.md    # Deployment guide
└── test_result.md             # Testing notes
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance
- Twilio account
- Mailgun account
- Stripe account
- Google Cloud project (for Calendar & Maps)

### Backend Setup

```bash
cd /app/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install emergentintegrations for AI features
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Set up environment variables (see .env section below)
cp .env.example .env

# Run the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
cd /app/frontend

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env

# Start development server
yarn start
```

### Using Supervisor (Production)

```bash
# Start all services
sudo supervisorctl start all

# Restart backend after code changes
sudo supervisorctl restart backend

# Restart frontend after code changes
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

---

## Features Overview

### Customer Features
- **Online Booking:** Airport shuttle, point-to-point, hourly charter, event transfers
- **Real-time Pricing:** Distance-based pricing with Google Maps API
- **Multiple Passengers:** Support for groups up to 11 passengers
- **Return Trips:** Book round-trip transfers
- **Flight Tracking:** Enter flight numbers for airport pickups
- **Payment Options:** Stripe (card), PayPal, Afterpay, Pay on pickup
- **Customer Details Saved:** Returning customers have details pre-filled
- **Booking Confirmation:** Email and SMS notifications
- **Add-ons:** Child seats, meet & greet, oversized luggage

### Admin Features
- **Dashboard:** Overview of all bookings with status filters
- **Booking Management:** Create, edit, delete, archive bookings
- **Driver Assignment:** Assign drivers to bookings (outbound & return)
- **Payment Tracking:** Update payment status, send payment links
- **SMS/Email:** Send confirmations, reminders, payment requests
- **Google Calendar Sync:** Automatic calendar events for bookings
- **Analytics:** Booking statistics and revenue tracking
- **Customer Database:** View and manage customer records
- **Driver Management:** Add/edit drivers, track availability
- **Archive System:** 7-year retention for completed bookings
- **CSV Export:** Export bookings for reporting

### Driver Features
- **Driver Portal:** View assigned jobs
- **Job Confirmation:** Accept/decline via SMS reply
- **Navigation:** One-click Google Maps directions
- **Earnings Tracker:** View payout calculations

### Automated Features
- **Daily Reminders:** 8 AM NZ time reminder emails to customers
- **Arrival Emails:** Special emails for airport arrivals
- **Return Trip Alerts:** Notifications for upcoming returns
- **Abandoned Booking Recovery:** Follow-up on incomplete bookings
- **Auto-Archive:** Completed bookings archived after trip date

---

## Database Schema

### Collections

#### `bookings`
```javascript
{
  id: "uuid",
  referenceNumber: "123",
  serviceType: "airport-shuttle",
  name: "Customer Name",
  email: "email@example.com",
  phone: "+6421234567",
  pickupAddress: "123 Street, Auckland",
  dropoffAddress: "Auckland Airport",
  date: "2026-01-04",
  time: "18:30",
  passengers: "4",
  flightNumber: "NZ123",
  flightTime: "20:00",
  bookReturn: true,
  returnDate: "2026-01-10",
  returnTime: "14:00",
  returnFlightNumber: "NZ456",
  status: "confirmed", // pending, confirmed, completed, cancelled
  payment_status: "unpaid", // unpaid, paid, pending, pay-on-pickup
  paymentMethod: "stripe",
  pricing: {
    basePrice: 150,
    stripeFee: 4.65,
    totalPrice: 154.65,
    distance: 35
  },
  driver_id: "driver-uuid",
  driver_name: "Driver Name",
  return_driver_id: "driver-uuid",
  return_driver_name: "Return Driver",
  calendar_event_id: "google-calendar-id",
  createdAt: "2026-01-01T10:00:00Z",
  notes: "Special instructions"
}
```

#### `bookings_archive`
Same structure as `bookings` plus:
```javascript
{
  archivedAt: "2026-01-05T02:00:00Z",
  archivedBy: "auto-archive",
  archiveReason: "auto",
  retentionExpiry: "2033-01-05T02:00:00Z" // 7 years
}
```

#### `drivers`
```javascript
{
  id: "uuid",
  name: "Driver Name",
  phone: "+6421234567",
  email: "driver@example.com",
  vehicleType: "sedan",
  vehicleCapacity: 4,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z"
}
```

#### `customers`
```javascript
{
  id: "uuid",
  name: "Customer Name",
  email: "customer@example.com",
  phone: "+6421234567",
  totalBookings: 5,
  lastBookingDate: "2026-01-04",
  createdAt: "2025-01-01T00:00:00Z"
}
```

#### `admin_users`
```javascript
{
  id: "uuid",
  username: "admin",
  hashed_password: "bcrypt-hash",
  role: "admin",
  createdAt: "2025-01-01T00:00:00Z"
}
```

---

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculate-price` | Calculate trip pricing |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/health` | Health check |

### Admin Endpoints (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/bookings` | List all bookings |
| GET | `/api/bookings/count` | Booking statistics |
| PATCH | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}` | Delete booking |
| POST | `/api/bookings/archive/{id}` | Archive booking |
| POST | `/api/bookings/unarchive/{id}` | Restore from archive |
| GET | `/api/bookings/archived` | List archived bookings |
| GET | `/api/bookings/search-all` | Search all bookings |
| POST | `/api/bookings/{id}/sync-calendar` | Sync to Google Calendar |
| POST | `/api/bookings/{id}/send-confirmation` | Send confirmation |
| POST | `/api/bookings/{id}/send-payment-link` | Send Stripe payment link |
| GET | `/api/drivers` | List drivers |
| POST | `/api/drivers` | Create driver |
| PATCH | `/api/drivers/{id}` | Update driver |
| DELETE | `/api/drivers/{id}` | Delete driver |

### Webhook Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/twilio/sms` | Twilio SMS webhook |
| POST | `/api/webhook/stripe` | Stripe payment webhook |

---

## Third-Party Integrations

### Twilio (SMS)
- **Purpose:** Customer confirmations, driver notifications, SMS replies
- **Webhook:** Configure `/api/webhook/twilio/sms` in Twilio console
- **Required:** Account SID, Auth Token, Phone Number

### Mailgun (Email)
- **Purpose:** Booking confirmations, reminders, payment receipts
- **Required:** API Key, Domain, From Email

### Stripe (Payments)
- **Purpose:** Card payments, payment links
- **Webhook:** Configure `/api/webhook/stripe` for payment events
- **Required:** Secret Key, Publishable Key, Webhook Secret

### Google Calendar
- **Purpose:** Sync bookings to admin calendar
- **OAuth:** `/api/google-calendar/login` for authorization
- **Required:** Client ID, Client Secret, Redirect URI

### Google Maps
- **Purpose:** Address autocomplete, distance calculation, route display
- **Required:** Maps JavaScript API Key, Directions API enabled

### OpenAI (via emergentintegrations)
- **Purpose:** AI email responses, smart suggestions
- **Required:** Emergent LLM Key

---

## Admin Panel Guide

### Login
- URL: `/admin/dashboard`
- Default credentials: Set during deployment

### Dashboard Sections
1. **Action Required** - Bookings needing attention
2. **Confirmation Status** - Pending driver confirmations
3. **Return Trips** - Upcoming returns
4. **Today's Operations** - Today's pickups
5. **All Bookings** - Full booking list with filters

### Tabs
- **Bookings** - Main booking management
- **Shuttle** - Shared shuttle optimization
- **Deleted** - Soft-deleted bookings (recoverable)
- **Archive** - Completed bookings (7-year retention)
- **Analytics** - Stats and charts
- **Customers** - Customer database
- **Drivers** - Driver management
- **Applications** - Driver applications
- **Marketing** - SEO and content
- **Import** - Bulk data import

### Quick Actions
- 👁 View booking details
- ✏️ Edit booking
- 📧 Send email
- 🔄 Resend confirmation
- 📦 Archive (for completed)
- 🗑 Delete

---

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=bookaride

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=bookings@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback

# AI
EMERGENT_LLM_KEY=your_emergent_key

# Security
JWT_SECRET=your-secure-random-string
ADMIN_PASSWORD_HASH=bcrypt-hash
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

---

## Deployment

### Pre-Deployment Checklist
1. ✅ All environment variables set
2. ✅ MongoDB connection tested
3. ✅ Twilio webhook URL configured
4. ✅ Stripe webhook URL configured
5. ✅ Google Calendar OAuth configured
6. ✅ CORS origins updated for production domain
7. ✅ Admin password changed from default

### Deployment Steps
1. Push code to repository
2. Build frontend: `yarn build`
3. Update environment variables on server
4. Restart services: `sudo supervisorctl restart all`
5. Verify health: `curl https://yourdomain.com/api/health`

### Post-Deployment Verification
- [ ] Home page loads
- [ ] Booking form works
- [ ] Price calculation works
- [ ] Admin login works
- [ ] Driver SMS works
- [ ] Payment links work
- [ ] Calendar sync works

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
tail -100 /var/log/supervisor/backend.err.log

# Common issues:
# - Missing environment variables
# - MongoDB connection failed
# - Port 8001 already in use
```

### Frontend won't start
```bash
# Check logs
tail -100 /var/log/supervisor/frontend.err.log

# Common issues:
# - yarn install not run
# - Missing REACT_APP_BACKEND_URL
```

### SMS not sending
- Verify Twilio credentials in .env
- Check Twilio console for errors
- Verify phone number format (+64...)

### Calendar sync fails
- Re-authorize Google Calendar at `/api/google-calendar/login`
- Check Google Cloud console for API quota

### Payments not processing
- Verify Stripe keys are live (not test)
- Check Stripe dashboard for webhook failures
- Verify webhook secret matches

---

## Support Contacts

- **Development:** Emergent Labs
- **Platform:** emergentai.com

---

*Last Updated: January 2026*
*Version: 2.0*
