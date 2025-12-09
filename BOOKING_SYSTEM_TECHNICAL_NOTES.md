# 📋 BookaRide Booking System - Complete Technical Notes
## For Agent in Job: 3b916225-97c1-4869-9a8e-2758f66770fb

---

## 🎯 System Overview

**Architecture:** React Frontend + FastAPI Backend + MongoDB
**Tech Stack:** 
- Frontend: React 18 + TailwindCSS + shadcn/ui
- Backend: FastAPI (Python)
- Database: MongoDB
- Payments: Stripe
- Notifications: Mailgun (email) + Twilio (SMS)
- Calendar: Google Calendar API (Service Account)

---

## 📊 Database Schema

### MongoDB Collection: `bookings`

**Document Structure:**
```json
{
  "id": "97b30601-bf58-43b6-81c9-0b510869a985",  // UUID v4
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+64211234567",
  "serviceType": "airport-shuttle",
  "pickupAddress": "123 Main St, Auckland",
  "pickupAddresses": ["456 Queen St", "789 Ponsonby Rd"],  // NEW: Multiple pickups
  "dropoffAddress": "Auckland Airport",
  "date": "2025-12-10",
  "time": "10:00",
  "passengers": "2",
  "departureFlightNumber": "NZ123",  // Optional
  "departureTime": "14:00",  // Optional
  "arrivalFlightNumber": "NZ456",  // Optional
  "arrivalTime": "09:00",  // Optional
  "pricing": {
    "distance": 25.5,
    "basePrice": 50.00,
    "airportFee": 10.00,
    "passengerFee": 5.00,
    "totalPrice": 65.00,
    "isOverridden": false  // NEW: Price override flag
  },
  "totalPrice": 65.00,
  "notes": "Extra luggage",
  "status": "confirmed",  // pending | confirmed | completed | cancelled
  "payment_status": "paid",  // paid | cash | unpaid
  "createdAt": "2025-12-08T10:30:00Z",
  "assignedDriver": "driver-uuid"  // Optional
}
```

### MongoDB Collection: `admins`

**Document Structure:**
```json
{
  "id": "admin-uuid",
  "username": "admin",
  "password": "$2b$12$hashed_password",  // bcrypt hashed
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Default Admin:**
- Username: `admin`
- Password: `BookARide2024!`

### MongoDB Collection: `drivers`

**Document Structure:**
```json
{
  "id": "driver-uuid",
  "name": "Driver Name",
  "email": "driver@example.com",
  "phone": "+64211111111",
  "vehicleType": "sedan",
  "available": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## 🔐 Authentication

### Admin Authentication
**Method:** JWT (JSON Web Tokens)

**Login Endpoint:** `POST /api/admin/login`
```json
Request:
{
  "username": "admin",
  "password": "BookARide2024!"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Protected Routes:** All `/api/bookings/*` admin endpoints require:
```
Authorization: Bearer <token>
```

**Token Expiry:** 24 hours

---

## 🚀 API Endpoints

### Public Endpoints (No Auth Required)

#### 1. Calculate Price
```
POST /api/calculate-price

Request:
{
  "serviceType": "airport-shuttle",
  "pickupAddress": "123 Main St, Auckland",
  "pickupAddresses": ["456 Queen St"],  // Optional, for multiple pickups
  "dropoffAddress": "Auckland Airport",
  "passengers": 2,
  "vipAirportPickup": false,
  "oversizedLuggage": false
}

Response:
{
  "distance": 25.5,
  "basePrice": 50.00,
  "airportFee": 10.00,
  "oversizedLuggageFee": 0.00,
  "passengerFee": 5.00,
  "totalPrice": 65.00
}
```

**Pricing Logic:**
- **Distance Calculation:** 
  - Single pickup: Google Distance Matrix API
  - Multiple pickups: Google Directions API with waypoints
- **Rate Structure:**
  - 0-75 km: $2.50/km
  - 75-100 km: $2.70/km
  - 100-300 km: $3.50/km
  - Minimum charge: $100
- **Extra Fees:**
  - Airport fee: $10 (if pickup/dropoff at airport)
  - Passenger fee: $5 per passenger (above 1)
  - Oversized luggage: $20
  - VIP service: $30

#### 2. Create Booking (Customer)
```
POST /api/bookings

Request:
{
  "serviceType": "airport-shuttle",
  "pickupAddress": "123 Main St",
  "pickupAddresses": ["456 Queen St"],  // Optional
  "dropoffAddress": "Airport",
  "date": "2025-12-10",
  "time": "10:00",
  "passengers": "2",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+64211234567",
  "notes": "Extra luggage",
  "pricing": { ... },
  "departureFlightNumber": "NZ123",  // Optional
  "arrivalFlightNumber": "NZ456"  // Optional
}

Response:
{
  "message": "Booking created successfully",
  "booking_id": "uuid",
  "status": "pending"  // Waiting for payment
}
```

#### 3. Create Stripe Checkout
```
POST /api/payment/create-checkout

Request:
{
  "booking_id": "uuid",
  ...booking_data
}

Response:
{
  "session_id": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

#### 4. Check Payment Status
```
GET /api/payment/status/{booking_id}

Response:
{
  "status": "paid" | "unpaid",
  "booking": { ... }
}
```

#### 5. Stripe Webhook
```
POST /api/webhook/stripe

Handles: checkout.session.completed
Action: Updates booking status to "confirmed", sends notifications
```

---

### Admin Endpoints (Auth Required)

#### 6. Get All Bookings
```
GET /api/bookings
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "name": "John Smith",
    ...all booking fields
  }
]
```

#### 7. Get Single Booking
```
GET /api/bookings/{booking_id}
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  ...booking details
}
```

#### 8. Update Booking Status
```
PATCH /api/bookings/{booking_id}
Authorization: Bearer <token>

Request:
{
  "status": "confirmed" | "completed" | "cancelled"
}
```

#### 9. Delete Booking
```
DELETE /api/bookings/{booking_id}
Authorization: Bearer <token>

Response:
{
  "message": "Booking deleted successfully"
}
```

#### 10. Create Manual Booking (Admin)
```
POST /api/bookings/manual
Authorization: Bearer <token>

Request:
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+64211234567",
  "serviceType": "airport-shuttle",
  "pickupAddress": "123 Main St",
  "pickupAddresses": ["456 Queen St"],  // Optional
  "dropoffAddress": "Airport",
  "date": "2025-12-10",
  "time": "10:00",
  "passengers": "2",
  "pricing": { ... },
  "paymentMethod": "cash" | "paid",
  "notes": "Notes",
  "priceOverride": 99.99  // Optional: Override calculated price
}

Response:
{
  "message": "Booking created successfully",
  "id": "uuid"
}
```

**Auto Actions:**
- Status set to "confirmed" immediately
- Email sent to customer
- SMS sent to customer
- Google Calendar event created
- Admin email notification sent

#### 11. Assign Driver
```
POST /api/bookings/{booking_id}/assign-driver
Authorization: Bearer <token>

Request:
{
  "driver_id": "driver-uuid"
}

Response:
{
  "message": "Driver assigned successfully"
}
```

**Auto Actions:**
- Email sent to driver
- SMS sent to driver

#### 12. Send Email to Customer
```
POST /api/send-booking-email
Authorization: Bearer <token>

Request:
{
  "email": "customer@example.com",
  "subject": "Subject",
  "message": "Message body"
}

Response:
{
  "message": "Email sent successfully"
}
```

#### 13. Send Booking to Admin Mailbox
```
POST /api/bookings/{booking_id}/send-to-admin
Authorization: Bearer <token>

Response:
{
  "message": "Booking details sent to bookings@bookaride.co.nz"
}
```

Sends comprehensive booking details with all info to admin email.

#### 14. Export Bookings to CSV
```
GET /api/bookings/export/csv
Authorization: Bearer <token>

Response: CSV file download
```

---

## 💳 Payment Flow

### Stripe Integration

**1. Customer completes booking form**
- Frontend validates data
- Calls `/api/calculate-price` to get pricing
- User confirms booking

**2. Frontend creates Stripe checkout**
```javascript
POST /api/payment/create-checkout
→ Creates Stripe Checkout Session
→ Returns checkout URL
```

**3. Customer redirected to Stripe**
- Stripe handles payment securely
- Customer enters card details
- Stripe processes payment

**4. Stripe redirects back**
- Success: `/payment/success?session_id=xxx`
- Cancel: `/payment/cancel`

**5. Payment Success page**
```javascript
useEffect(() => {
  // Poll payment status
  const checkStatus = async () => {
    const response = await fetch(`/api/payment/status/${bookingId}`);
    if (response.status === 'paid') {
      // Show success message
    }
  };
}, []);
```

**6. Stripe Webhook (Background)**
```
POST /api/webhook/stripe
Event: checkout.session.completed
Action:
  - Update booking status to "confirmed"
  - Send email to customer
  - Send SMS to customer
  - Create Google Calendar event
  - Send admin notification
```

**Stripe Configuration:**
```env
STRIPE_API_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 📧 Notification System

### Email Notifications (Mailgun)

**Configuration:**
```env
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.bookaride.co.nz
SENDER_EMAIL=noreply@mg.bookaride.co.nz
ADMIN_EMAIL=bookings@bookaride.co.nz
```

**1. Customer Booking Confirmation**
- Sent when: Payment confirmed OR admin creates manual booking
- Recipient: Customer email
- Contains:
  - Booking reference (first 8 chars of UUID, uppercase)
  - Customer details
  - Trip details
  - Pricing breakdown
  - Contact information

**Template:**
```
Subject: Booking Confirmation - 97B30601

✅ Booking Confirmed
Reference: 97B30601
Name: John Smith
Pickup: 123 Main St, Auckland
Drop-off: Auckland Airport
Date: Dec 10, 2025 at 10:00 AM
Passengers: 2
Total: $65.00 NZD

Thank you for booking with BookaRide NZ!
```

**2. Admin Booking Notification**
- Sent when: New customer booking confirmed
- Recipient: bookings@bookaride.co.nz
- Contains:
  - All booking details
  - Customer contact info
  - Action prompt (assign driver)
  - Link to admin dashboard

**3. Driver Assignment Notification**
- Sent when: Admin assigns driver to booking
- Recipient: Driver email
- Contains:
  - Booking details
  - Pickup/dropoff addresses
  - Customer contact
  - Earnings (15% commission)

**4. Custom Admin Emails**
- Admin can send custom emails to customers
- From admin dashboard
- Uses Mailgun API

### SMS Notifications (Twilio)

**Configuration:**
```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+64211234567
```

**1. Customer Booking Confirmation SMS**
```
Book A Ride NZ - Booking Confirmed!
Ref: 97B30601
Pickup: 123 Main St
Date: Dec 10, 2025 at 10:00 AM
Total: $65.00 NZD

Thank you for booking with us!
```

**2. Driver Assignment SMS**
```
BookaRide NZ - New Booking Assigned!
Ref: 97B30601
Pickup: 123 Main St at 10:00 AM
Customer: John Smith (+64211234567)
Earnings: $9.75

Login to view details.
```

---

## 📅 Google Calendar Integration

### Service Account Method

**Configuration:**
```env
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
```

**File:** `/app/backend/service_account.json` (for local dev)

**How it Works:**
1. Backend uses Service Account credentials
2. No OAuth flow needed
3. Creates events in business calendar
4. Calendar must be shared with service account email

**Event Creation:**
```python
async def create_calendar_event(booking: dict):
    creds = service_account.Credentials.from_service_account_info(
        json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_JSON']),
        scopes=['https://www.googleapis.com/auth/calendar']
    )
    
    service = build('calendar', 'v3', credentials=creds)
    
    event = {
        'summary': f'Booking: {booking["name"]}',
        'location': booking['pickupAddress'],
        'description': f'Ref: {booking["id"][:8]}\nPhone: {booking["phone"]}',
        'start': {
            'dateTime': f'{booking["date"]}T{booking["time"]}:00',
            'timeZone': 'Pacific/Auckland'
        },
        'end': {
            'dateTime': calculated_end_time,
            'timeZone': 'Pacific/Auckland'
        }
    }
    
    service.events().insert(calendarId='primary', body=event).execute()
```

**Calendar ID:** Usually 'primary' or specific calendar ID

---

## 🆕 New Features Added (This Session)

### 1. Price Override (Admin)
- Admin can manually set booking price
- Overrides calculated price
- Stored in `pricing.isOverridden` flag
- UI shows indicator when price is overridden

### 2. Payment Status Column
- Admin dashboard shows payment status
- Color-coded badges:
  - 🟢 Green = Paid
  - 🟡 Yellow = Cash
  - 🔴 Red = Unpaid
- Visible in booking table and details modal

### 3. Multiple Pickup Locations
- Customers can add unlimited pickup addresses
- UI has "+ Add Another Pickup Location" button
- Backend calculates route through all stops
- Uses Google Directions API for multi-stop routes
- Pricing based on total distance

**Implementation:**
- Frontend: Array of pickup addresses
- Backend: `pickupAddresses: List[str]`
- Google API: Waypoints in Directions API
- Storage: Array in MongoDB

### 4. Send Booking to Admin Mailbox
- Button in booking details modal
- Sends comprehensive email to admin
- Includes all booking information
- Formatted HTML email

### 5. Admin Email Sending
- Admin can send custom emails to customers
- From booking details modal
- Professional HTML template
- Uses Mailgun API

### 6. Automatic Admin Notifications
- All new bookings trigger admin email
- Sent to bookings@bookaride.co.nz
- Contains booking summary
- Action prompts

### 7. Booking Reference Consistency
- All systems use same reference format
- First 8 characters of UUID (uppercase)
- Example: `97B30601`
- Appears in: emails, SMS, admin panel, database

---

## 🎨 Frontend Structure

### Key Components

**1. SEO Component** (`/components/SEO.jsx`)
- Handles meta tags
- Open Graph (Facebook)
- Twitter Cards
- Per-page customization
```jsx
<SEO 
  title="Page Title"
  description="Description"
  ogImage="/images/preview.jpg"
  keywords="keywords"
/>
```

**2. Admin Dashboard** (`/pages/AdminDashboard.jsx`)
- Main admin interface
- Tabs: Overview, Bookings, Customers, Drivers, Settings
- Features:
  - View all bookings
  - Create manual bookings
  - Delete bookings
  - Export to CSV
  - Send emails
  - Assign drivers
  - Price override
  - Multiple pickups support

**3. Booking Form** (`/pages/BookNow.jsx`)
- Customer booking interface
- Google Places Autocomplete
- Real-time price calculation
- Multiple pickup support
- Flight information (optional)
- Return trip option
- Stripe payment integration

**4. Payment Pages**
- Success: `/pages/PaymentSuccess.jsx`
- Cancel: `/pages/PaymentCancel.jsx`

### Site Configuration

**File:** `/config/siteConfig.js`
```javascript
const siteConfig = {
  siteName: 'BookaRide NZ',
  siteUrl: 'https://bookaride.co.nz',
  phone: '+64 21 743 321',
  email: 'bookings@bookaride.co.nz',
  description: '...',
  keywords: '...',
  // ... more config
};
```

---

## 🔒 Environment Variables

### Backend `.env`

```bash
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_ridenow_db"

# JWT
JWT_SECRET_KEY="bookaride-super-secret-jwt-key-2024"

# Google Maps
GOOGLE_MAPS_API_KEY="AIzaxxx"

# Stripe
STRIPE_API_KEY="sk_live_xxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Mailgun
MAILGUN_API_KEY="xxx"
MAILGUN_DOMAIN="mg.bookaride.co.nz"
SENDER_EMAIL="noreply@mg.bookaride.co.nz"
ADMIN_EMAIL="bookings@bookaride.co.nz"

# Twilio
TWILIO_ACCOUNT_SID="ACxxx"
TWILIO_AUTH_TOKEN="xxx"
TWILIO_PHONE_NUMBER="+64211234567"

# Google Calendar Service Account
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Frontend `.env`

```bash
REACT_APP_BACKEND_URL=https://booking-revamp-4.preview.emergentagent.com/api
REACT_APP_STRIPE_KEY=pk_live_xxx
REACT_APP_GOOGLE_MAPS_KEY=AIzaxxx
```

---

## 🧪 Testing

### Manual Testing Checklist

**Customer Flow:**
- [ ] Visit booking page
- [ ] Enter addresses (test autocomplete)
- [ ] Add multiple pickups
- [ ] Calculate price
- [ ] Fill customer details
- [ ] Complete payment (Stripe test mode)
- [ ] Verify confirmation email received
- [ ] Verify confirmation SMS received
- [ ] Check booking appears in admin panel

**Admin Flow:**
- [ ] Login to admin panel
- [ ] View all bookings
- [ ] Create manual booking
- [ ] Test price override
- [ ] Assign driver to booking
- [ ] Send email to customer
- [ ] Send booking to admin mailbox
- [ ] Export bookings to CSV
- [ ] Delete test booking

**Integrations:**
- [ ] Stripe payment processing
- [ ] Mailgun email delivery
- [ ] Twilio SMS delivery
- [ ] Google Calendar event creation
- [ ] Google Maps distance calculation

### Test Credentials

**Admin Login:**
```
Username: admin
Password: BookARide2024!
```

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Booking Status Stuck on "Pending"
**Cause:** Payment not completed or webhook not fired
**Solution:** 
- Check Stripe dashboard for payment status
- Verify webhook endpoint configured
- Check backend logs for webhook errors

### Issue 2: Emails Not Sending
**Cause:** Mailgun not configured or API key invalid
**Solution:**
- Verify MAILGUN_API_KEY in .env
- Check Mailgun dashboard for sending status
- Verify domain verified in Mailgun

### Issue 3: SMS Not Sending
**Cause:** Twilio credentials invalid or balance low
**Solution:**
- Verify Twilio credentials
- Check Twilio balance
- Verify phone number format (+64...)

### Issue 4: Google Calendar Not Creating Events
**Cause:** Service account not configured or calendar not shared
**Solution:**
- Verify GOOGLE_SERVICE_ACCOUNT_JSON in .env
- Share calendar with service account email
- Check backend logs for errors

### Issue 5: Price Calculation Fails
**Cause:** Google Maps API key invalid or quota exceeded
**Solution:**
- Verify GOOGLE_MAPS_API_KEY
- Check Google Cloud Console for quota
- Enable Distance Matrix API and Directions API

---

## 📦 Dependencies

### Backend (Python)
```txt
fastapi
uvicorn
motor  # Async MongoDB
pymongo
pydantic
python-jose[cryptography]  # JWT
passlib[bcrypt]  # Password hashing
python-multipart
python-dotenv
requests
google-api-python-client
google-auth
emergentintegrations  # Stripe wrapper
```

### Frontend (Node.js)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "@stripe/stripe-js": "^2.0.0",
    "react-helmet-async": "^1.3.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.263.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 🚀 Deployment Notes

### Supervisor Configuration
Both backend and frontend run via supervisor:
- Backend: `sudo supervisorctl restart backend`
- Frontend: `sudo supervisorctl restart frontend`

### Hot Reload
- Backend: Auto-reloads on code changes
- Frontend: Hot reload enabled in development

### Production Build
```bash
cd /app/frontend
yarn build
```
Creates optimized build in `/app/frontend/build`

### Logs
- Backend: `/var/log/supervisor/backend.err.log`
- Frontend: `/var/log/supervisor/frontend.err.log`

---

## 📊 Current Status

### What Works ✅
- Customer booking with payment
- Admin manual booking (cash/paid)
- Multiple pickup locations
- Price calculation (single & multi-stop)
- Price override (admin)
- Email notifications (customer, admin, driver)
- SMS notifications (customer, driver)
- Google Calendar integration
- Payment status tracking
- Booking reference system
- Admin dashboard full features
- CSV export
- Driver assignment

### Known Issues ⚠️
- Frontend deployment pipeline issue (main site)
- Changes not showing on production URL
- Requires Emergent support intervention

### Deployment Ready ✅
- Backend: Fully functional
- Database: Schema complete
- Integrations: All working
- Frontend: Code complete
- Build: Production ready

---

## 🎯 Summary for New Agent

**You need to:**
1. Copy this backend setup (shared between domains)
2. Use SAME database connection
3. Use SAME environment variables
4. Create international frontend branding
5. Add 4 international routes
6. Configure bookaridenz.com domain
7. Deploy

**Everything is ready to replicate for bookaridenz.com!**

---

## 📞 Support Contacts

**Emergent Platform:**
- Discord: https://discord.gg/VzKfwCXC4A
- Email: support@emergent.sh

**This Documentation:**
- Created: December 8, 2025
- For: BookaRideNZ.com deployment
- Job ID: 3b916225-97c1-4869-9a8e-2758f66770fb
