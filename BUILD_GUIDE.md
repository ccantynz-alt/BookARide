# BookaRide Complete Build Guide

> **For Agents:** Build this website EXACTLY as documented. Follow every step precisely.

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Required API Keys & Credentials](#required-api-keys--credentials)
4. [Backend Environment Variables](#backend-environment-variables)
5. [Frontend Environment Variables](#frontend-environment-variables)
6. [Database Schema](#database-schema)
7. [Pricing Configuration](#pricing-configuration)
8. [Core Features](#core-features)
9. [Third-Party Integrations](#third-party-integrations)
10. [Frontend Pages](#frontend-pages)
11. [Frontend Components](#frontend-components)
12. [Backend API Endpoints](#backend-api-endpoints)
13. [Design System](#design-system)
14. [Special Business Logic](#special-business-logic)
15. [Scheduled Tasks](#scheduled-tasks)
16. [Testing Checklist](#testing-checklist)

---

## Overview

BookaRide is a premium airport shuttle booking platform with:
- Real-time price calculator using Google Maps API
- Multi-payment gateway support (Stripe, PayPal, Afterpay)
- Automated SMS & Email notifications (Twilio, Mailgun)
- AI-powered chatbot and email auto-responder (OpenAI GPT)
- Live flight tracking (AviationStack API)
- Google Calendar integration
- iCloud contact sync
- Driver management portal
- Admin dashboard with full booking management

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Tailwind CSS + Shadcn UI |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB |
| Authentication | JWT + Google OAuth |
| Hosting | Kubernetes (Emergent Platform) |

---

## Required API Keys & Credentials

### CRITICAL: Obtain these BEFORE building

| Service | Key Name | Where to Get |
|---------|----------|--------------|
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Enable Distance Matrix API |
| **Stripe** | `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| **Twilio** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | [Twilio Console](https://console.twilio.com) |
| **Mailgun** | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | [Mailgun Dashboard](https://app.mailgun.com/app/sending/domains) |
| **OpenAI** | Use Emergent LLM Key | Built into Emergent platform |
| **AviationStack** | `AVIATIONSTACK_API_KEY` | [AviationStack](https://aviationstack.com/signup/free) |
| **Afterpay** | `AFTERPAY_MERCHANT_ID`, `AFTERPAY_SECRET_KEY` | [Afterpay Merchant Portal](https://portal.afterpay.com) |
| **Google Calendar** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON` | [Google Cloud Console](https://console.cloud.google.com) |
| **iCloud** | `ICLOUD_EMAIL`, `ICLOUD_APP_PASSWORD` | [Apple ID](https://appleid.apple.com) - Generate App-Specific Password |
| **PayPal** | `PAYPAL_ME_USERNAME` | [PayPal.me](https://www.paypal.com/paypalme) |

---

## Backend Environment Variables

Create `/app/backend/.env`:

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=your_database_name

# Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
ADMIN_EMAIL=admin@yourdomain.com

# Domain
PUBLIC_DOMAIN=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,http://localhost:3000

# Google Maps (REQUIRED for pricing)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Stripe Payments
STRIPE_API_KEY=sk_live_xxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxx

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Mailgun Email
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=mail.yourdomain.com
SENDER_EMAIL=bookings@yourdomain.com

# SMTP Fallback (Gmail)
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_FILE=service-account.json
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# iCloud Contacts
ICLOUD_EMAIL=your_appleid@icloud.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Flight Tracking
AVIATIONSTACK_API_KEY=your_aviationstack_key

# Afterpay
AFTERPAY_MERCHANT_ID=your_merchant_id
AFTERPAY_SECRET_KEY=your_secret_key
AFTERPAY_ENV=sandbox

# PayPal
PAYPAL_ME_USERNAME=YourPayPalMe
```

---

## Frontend Environment Variables

Create `/app/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
WDS_SOCKET_PORT=443
```

---

## Database Schema

### Collections

#### 1. `bookings`
```javascript
{
  id: "uuid",
  referenceNumber: 55,  // Sequential, starts at 10
  name: "Customer Name",
  email: "customer@email.com",
  phone: "+64211234567",
  serviceType: "airport-shuttle", // airport-shuttle, private-transfer, hobbiton, cruise
  pickupAddress: "123 Main St, Auckland",
  pickupAddresses: [],  // Additional pickup stops
  dropoffAddress: "Auckland Airport",
  date: "2025-12-20",
  time: "10:00",
  passengers: "2",
  pricing: { totalPrice: 150.00, distance: 45.5, basePrice: 140, ratePerKm: 2.47 },
  totalPrice: 150.00,
  status: "confirmed", // pending, confirmed, completed, cancelled
  payment_status: "paid", // unpaid, paid, pay-on-pickup
  bookReturn: true,
  returnDate: "2025-12-25",
  returnTime: "15:00",
  flightArrivalNumber: "NZ123",
  flightArrivalTime: "09:30",
  assignedDriver: { id, name, phone },
  notes: "",
  createdAt: ISODate()
}
```

#### 2. `admin_users`
```javascript
{
  id: "uuid",
  username: "admin",
  email: "admin@yourdomain.com",
  hashed_password: "bcrypt_hash",
  createdAt: ISODate()
}
```

#### 3. `drivers`
```javascript
{
  id: "uuid",
  name: "Driver Name",
  email: "driver@email.com",
  phone: "+64211234567",
  vehicle: "Toyota Hiace - ABC123",
  status: "active", // active, inactive
  hashed_password: "bcrypt_hash"
}
```

#### 4. `counters`
```javascript
{
  _id: "booking_reference",
  seq: 60  // Current sequence number
}
```

---

## Pricing Configuration

### Tiered Distance-Based Pricing

| Distance (km) | Rate per km |
|---------------|-------------|
| 0 - 15 km | $12.00/km |
| 15 - 15.8 km | $8.00/km |
| 15.8 - 16 km | $6.00/km |
| 16 - 25.5 km | $5.50/km |
| 25.5 - 35 km | $5.00/km |
| 35 - 50 km | $4.00/km |
| 50 - 60 km | $2.60/km |
| 60 - 75 km | $2.47/km |
| 75 - 100 km | $2.70/km |
| 100+ km | $3.50/km |

### Additional Fees
- **Minimum Fare:** $100
- **VIP Airport Pickup:** +$15
- **Oversized Luggage:** +$25
- **Extra Passengers:** +$5 per person (first passenger included)
- **Return Trip:** 2x total price

### Formula
```python
base_price = distance_km * rate_per_km
total = max(base_price + extras, 100.00)  # $100 minimum
```

---

## Core Features

### 1. Real-Time Price Calculator
- Uses Google Maps Distance Matrix API
- Supports multiple pickup stops
- Calculates return trip pricing
- Shows rate per km in response

### 2. Booking System
- Online booking form with Google Places autocomplete
- Manual booking creation by admin
- Booking reference numbers (sequential from #10)
- Return trip support
- Flight details capture

### 3. Payment Processing
- **Stripe:** Primary payment gateway
- **PayPal:** PayPal.me link generation
- **Afterpay:** Direct API integration (sandbox/production)
- **Pay on Pickup:** Cash option

### 4. Notifications
- **Email:** Mailgun (primary) + Gmail SMTP (fallback)
- **SMS:** Twilio
- Beautiful HTML email templates
- Day-before booking reminders (8 AM NZ time)
- Driver assignment notifications

### 5. Admin Dashboard
- Full booking management (CRUD)
- Driver management
- Manual booking creation
- Bulk status updates
- Analytics dashboard
- Export to CSV
- iCloud contact sync

### 6. Driver Portal
- Driver login with password
- View assigned bookings
- Schedule view

### 7. AI Features
- Chatbot (OpenAI GPT) on booking page
- AI Email Auto-Responder for incoming emails

### 8. Flight Tracking
- Real-time flight status via AviationStack API
- Dedicated flight tracker page
- Integration in booking form

### 9. Google Calendar Sync
- Auto-create calendar events for bookings
- Non-English text translation
- Colour-coded by service type

### 10. iCloud Contact Sync
- Auto-add customers to iCloud contacts
- Duplicate prevention using deterministic UIDs
- Bulk sync for existing bookings

---

## Third-Party Integrations

### 1. Google Maps Integration
```python
# Distance calculation
url = "https://maps.googleapis.com/maps/api/distancematrix/json"
params = {
    'origins': pickup_address,
    'destinations': dropoff_address,
    'key': GOOGLE_MAPS_API_KEY
}
```

### 2. Stripe Integration
```python
# Create checkout session
stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
        'price_data': {
            'currency': 'nzd',
            'unit_amount': int(amount * 100),
            'product_data': {'name': f'Booking #{ref}'}
        },
        'quantity': 1
    }],
    mode='payment',
    success_url=f'{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}'
)
```

### 3. Twilio SMS
```python
from twilio.rest import Client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
client.messages.create(
    body=message,
    from_=TWILIO_PHONE_NUMBER,
    to=customer_phone  # E.164 format: +64211234567
)
```

### 4. Mailgun Email
```python
requests.post(
    f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
    auth=("api", MAILGUN_API_KEY),
    data={
        "from": f"Company <{SENDER_EMAIL}>",
        "to": recipient,
        "subject": subject,
        "html": html_content
    }
)
```

### 5. OpenAI (via Emergent)
```python
from emergentintegrations.llm.chat import chat, Message, ModelType

response = await chat(
    emergent_api_key=EMERGENT_API_KEY,
    model=ModelType.GPT_4O,
    system=system_prompt,
    messages=[Message(role='user', content=user_message)]
)
```

### 6. AviationStack Flight Tracking
```python
url = "http://api.aviationstack.com/v1/flights"
params = {
    'access_key': AVIATIONSTACK_API_KEY,
    'flight_iata': flight_number
}
```

### 7. iCloud CardDAV
```python
# Deterministic UID to prevent duplicates
def generate_contact_uid(phone, email):
    unique_key = f"bookaride_{phone}_{email}"
    return hashlib.md5(unique_key.encode()).hexdigest()

# Upload vCard
requests.put(
    f"https://p115-contacts.icloud.com:443/{principal_id}/carddavhome/card/{uid}.vcf",
    auth=(ICLOUD_EMAIL, ICLOUD_APP_PASSWORD),
    data=vcard_data,
    headers={'Content-Type': 'text/vcard'}
)
```

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero section, services, testimonials |
| Book Now | `/book-now` | Main booking form with price calculator |
| Services | `/services` | Service details |
| Hobbiton Transfers | `/hobbiton-transfers` | Hobbiton tour bookings |
| Cruise Transfers | `/cruise-transfers` | Cruise ship transfers |
| Flight Tracker | `/flight-tracker` | Real-time flight tracking |
| Travel Guide | `/travel-guide` | Airport terminal guide, NZ tips |
| About | `/about` | Company info |
| Contact | `/contact` | Contact form |
| Admin Login | `/admin/login` | Admin authentication |
| Admin Dashboard | `/admin/dashboard` | Full admin panel |
| Driver Login | `/driver/login` | Driver authentication |
| Driver Portal | `/driver/portal` | Driver booking view |
| Payment Success | `/payment-success` | Post-payment confirmation |

---

## Frontend Components

### Core Components
- `Header.jsx` - Navigation with glassmorphism
- `Footer.jsx` - Site footer with links
- `AIChatbot.jsx` - OpenAI-powered chat widget
- `FlightTracker.jsx` - Flight status lookup
- `PriceComparison.jsx` - Competitor price comparison

### Booking Components
- `BookingAddOns.jsx` - Optional extras selection
- `DateTimePicker.jsx` - Date/time selection
- `ExitIntentPopup.jsx` - Abandonment prevention
- `WhatsAppButton.jsx` - Click-to-chat WhatsApp

### Widgets (Booking Page)
- `CurrencyConverter.jsx` - Multi-currency conversion
- `TripCostSplitter.jsx` - Split fare calculator
- `WeatherWidget.jsx` - Destination weather
- `CountdownWidget.jsx` - Time until trip

### Design Components
- `GlassComponents.jsx` - Glassmorphism UI elements
- `AnimatedSection.jsx` - Scroll animations
- `VehicleGallery.jsx` - Fleet showcase
- `TestimonialsCarousel.jsx` - Review slider

---

## Backend API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/register` | Admin registration |
| GET | `/api/admin/me` | Get current admin |
| POST | `/api/admin/password-reset/request` | Request password reset |
| POST | `/api/admin/password-reset/confirm` | Confirm password reset |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculate-price` | Calculate trip price |
| POST | `/api/bookings` | Create customer booking |
| POST | `/api/bookings/manual` | Create admin booking |
| GET | `/api/bookings` | List all bookings (admin) |
| PATCH | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}` | Delete booking |
| POST | `/api/bookings/{id}/resend-confirmation` | Resend emails |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-checkout` | Create Stripe session |
| GET | `/api/payment/status/{session_id}` | Check payment status |
| POST | `/api/afterpay/create-checkout` | Create Afterpay session |
| GET | `/api/afterpay/configuration` | Get Afterpay config |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/{id}` | Update driver |
| DELETE | `/api/drivers/{id}` | Delete driver |
| PATCH | `/api/drivers/{id}/assign` | Assign to booking |
| POST | `/api/driver/login` | Driver authentication |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flight/track` | Track flight status |
| POST | `/api/chatbot/message` | AI chatbot |
| POST | `/api/email/incoming` | Email webhook |
| POST | `/api/admin/sync-contacts-to-icloud` | Bulk contact sync |
| GET | `/api/analytics/stats` | Dashboard analytics |

---

## Design System

### Colors
```css
--gold: #D4AF37
--black: #000000
--gray-900: #111827
--white: #FFFFFF
```

### Glassmorphism
```css
/* Header */
backdrop-blur-lg bg-gray-900/95 border-b border-gold/20

/* Cards */
bg-white/5 backdrop-blur-xl border border-white/10

/* Hover */
hover:bg-white/10 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]
```

### Typography
- Headings: `font-bold text-4xl md:text-5xl`
- Body: `text-base text-gray-600`
- Gold accent: `text-gold`

---

## Special Business Logic

### Phone Number Formatting (E.164)
```python
def format_nz_phone(phone: str) -> str:
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('64'):
        return f'+{digits}'
    if digits.startswith('0'):
        return f'+64{digits[1:]}'
    return f'+64{digits}'
```

### Return Trip Email Fix
```python
# Check BOTH bookReturn AND returnDate (fallback for legacy)
if (has_return or return_date) and return_date:
    # Show return trip section
```

### Duplicate Contact Prevention
```python
# Same customer = same UID = UPDATE not CREATE
contact_uid = generate_contact_uid(phone, email)
```

---

## Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| Booking Reminders | 8:00 AM NZ Daily | Send day-before reminders |
| Backup Reminder Check | Every Hour | Catch missed reminders |
| Abandoned Booking Recovery | Every 30 mins | Send recovery emails |

---

## Testing Checklist

### Backend Tests
- [ ] Price calculation (short trip $100 min, long trip tiered rates)
- [ ] Booking creation with all fields
- [ ] Return trip pricing (2x)
- [ ] Email sending (Mailgun + SMTP fallback)
- [ ] SMS sending (Twilio)
- [ ] Stripe checkout creation
- [ ] Flight tracking API
- [ ] Admin authentication
- [ ] Driver assignment notifications

### Frontend Tests
- [ ] Homepage loads with hero section
- [ ] Navigation links work
- [ ] Booking form with Google Places autocomplete
- [ ] Price calculator updates in real-time
- [ ] Payment flow (Stripe, PayPal, Afterpay)
- [ ] Mobile responsive design
- [ ] Admin dashboard login and CRUD
- [ ] Driver portal login

---

## Quick Start for Agents

1. **Set up environment variables** - Copy all from this guide
2. **Install dependencies:**
   ```bash
   cd /app/backend && pip install -r requirements.txt
   cd /app/frontend && yarn install
   ```
3. **Start services:**
   ```bash
   sudo supervisorctl restart backend frontend
   ```
4. **Create admin user:**
   ```bash
   curl -X POST "$API/admin/register" -H "Content-Type: application/json" \
     -d '{"username":"admin","email":"admin@domain.com","password":"YourSecurePassword"}'
   ```
5. **Test pricing endpoint:**
   ```bash
   curl -X POST "$API/calculate-price" -H "Content-Type: application/json" \
     -d '{"pickupAddress":"Auckland CBD","dropoffAddress":"Auckland Airport","passengers":2}'
   ```

---

## Support

For questions about this build guide, refer to the original BookaRide implementation or contact the development team.

**Last Updated:** December 2025
**Version:** 1.0
