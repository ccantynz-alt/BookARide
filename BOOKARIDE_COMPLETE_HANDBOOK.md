# BookaRide.co.nz - Complete Replication Handbook

> **Purpose:** This handbook allows ANY agent to build an EXACT copy of BookaRide.co.nz
> **Last Updated:** December 2025
> **Original Site:** https://bookaride.co.nz

---

## TABLE OF CONTENTS

1. [What This Site Does](#1-what-this-site-does)
2. [Tech Stack](#2-tech-stack)
3. [Required API Keys (Get These First!)](#3-required-api-keys)
4. [Database Setup](#4-database-setup)
5. [Backend Setup](#5-backend-setup)
6. [Frontend Setup](#6-frontend-setup)
7. [Admin Dashboard Features](#7-admin-dashboard-features)
8. [Pricing System](#8-pricing-system)
9. [Booking Flow](#9-booking-flow)
10. [Notifications System](#10-notifications-system)
11. [Driver Management](#11-driver-management)
12. [Integrations](#12-integrations)
13. [Pages To Build](#13-pages-to-build)
14. [Design System](#14-design-system)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. WHAT THIS SITE DOES

BookaRide is a **premium airport shuttle booking platform** for New Zealand with these features:

### Customer Features:
- Book airport transfers with real-time pricing
- Multiple pickup addresses (up to 3 stops)
- Return trip booking
- Multiple payment options (Stripe, PayPal, Cash, Afterpay)
- Flight tracking integration
- Booking confirmations via Email + SMS
- Day-before reminders
- AI chatbot for questions

### Admin Features:
- Full booking management (CRUD)
- **Deleted Bookings Recovery** (soft-delete with restore)
- Driver assignment with SMS/Email notifications
- Customer database
- Revenue analytics
- SEO page management
- Facebook marketing strategy
- CSV import/export
- Bulk contact sync to iCloud/iPhone

### Driver Features:
- Driver portal with assigned jobs
- Job details with navigation links
- Commission calculation (15% of fare)

---

## 2. TECH STACK

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Tailwind CSS + Shadcn UI |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB |
| Authentication | JWT (Admin) + Google OAuth (optional) |
| Hosting | Emergent Platform (Kubernetes) |

---

## 3. REQUIRED API KEYS

### CRITICAL: Get these BEFORE you start building!

| Service | Keys Needed | Purpose | Where to Get |
|---------|-------------|---------|--------------|
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | Price calculation, address autocomplete | [Google Cloud Console](https://console.cloud.google.com) - Enable "Distance Matrix API" + "Places API" |
| **Stripe** | `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY` | Card payments | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| **Twilio** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS notifications | [Twilio Console](https://console.twilio.com) |
| **Mailgun** | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | Email sending | [Mailgun Dashboard](https://app.mailgun.com) |
| **OpenAI** | Use Emergent LLM Key | AI chatbot, email auto-responder | Built into Emergent - use `emergent_integrations_manager` |
| **AviationStack** | `AVIATIONSTACK_API_KEY` | Flight tracking | [AviationStack](https://aviationstack.com/signup/free) |

### Optional (but recommended):
| Service | Keys Needed | Purpose |
|---------|-------------|---------|
| **Google Calendar** | Service Account JSON | Sync bookings to calendar |
| **iCloud** | `ICLOUD_EMAIL`, `ICLOUD_APP_PASSWORD` | Sync contacts to iPhone |
| **PayPal** | `PAYPAL_ME_USERNAME` | PayPal payments (simple PayPal.me link) |
| **Afterpay** | `AFTERPAY_MERCHANT_ID`, `AFTERPAY_SECRET_KEY` | Buy Now Pay Later |

---

## 4. DATABASE SETUP

### MongoDB Collections:

```javascript
// 1. bookings - Main booking data
{
  id: "uuid",
  referenceNumber: 123,  // Sequential, auto-generated
  name: "Customer Name",
  customerName: "Customer Name",  // Duplicate for compatibility
  email: "customer@email.com",
  phone: "+64211234567",
  serviceType: "private-transfer",  // or "airport-shuttle"
  date: "2025-12-25",
  time: "10:00",
  passengers: "2",
  pickupAddress: "123 Main St, Auckland",
  pickupAddresses: [],  // Additional stops
  dropoffAddress: "Auckland Airport",
  pricing: {
    totalPrice: 150.00,
    basePrice: 150.00,
    distance: 25.5,
    ratePerKm: 3.50
  },
  totalPrice: 150.00,
  payment_status: "unpaid",  // or "paid", "cash"
  status: "confirmed",  // or "pending", "completed", "cancelled"
  
  // Return trip (optional)
  bookReturn: false,
  returnDate: "",
  returnTime: "",
  
  // Flight info (optional)
  arrivalFlightNumber: "NZ123",
  arrivalTime: "09:30",
  departureFlightNumber: "",
  departureTime: "",
  
  // Driver assignment
  driver_id: null,
  driver_name: "",
  driver_phone: "",
  driver_email: "",
  driver_assigned_at: null,
  
  // Metadata
  notes: "",
  createdAt: "2025-12-16T10:00:00Z"
}

// 2. deleted_bookings - Soft-deleted bookings (for recovery)
{
  ...booking_fields,
  deletedAt: "2025-12-16T10:00:00Z",
  deletedBy: "admin"
}

// 3. drivers
{
  id: "uuid",
  name: "Driver Name",
  email: "driver@email.com",
  phone: "0271234567",
  license_number: "ABC123",
  status: "active",  // or "inactive", "on_leave"
  password_hash: "...",  // For driver portal login
  notes: "",
  createdAt: "2025-12-01T00:00:00Z"
}

// 4. admin_users
{
  id: "uuid",
  username: "admin",
  email: "admin@domain.com",
  password_hash: "...",
  createdAt: "2025-12-01T00:00:00Z"
}

// 5. seo_pages - Dynamic SEO landing pages
{
  page_path: "/auckland-airport-shuttle",
  page_name: "Auckland Airport Shuttle",
  title: "Auckland Airport Shuttle Service",
  description: "...",
  h1: "Auckland Airport Shuttle",
  content: "...",
  keywords: ["auckland", "airport", "shuttle"]
}
```

---

## 5. BACKEND SETUP

### Environment Variables (`/app/backend/.env`):

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=your_database_name

# Authentication
JWT_SECRET_KEY=generate-a-secure-random-string-here

# Domain (change for your site)
PUBLIC_DOMAIN=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,http://localhost:3000

# Google Maps (REQUIRED)
GOOGLE_MAPS_API_KEY=your_key_here

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Twilio SMS
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+64xxxxxxxxx

# Mailgun Email
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.yourdomain.com

# Flight Tracking
AVIATIONSTACK_API_KEY=xxx

# Emergent LLM (for AI features)
EMERGENT_LLM_KEY=xxx

# Admin notification email
ADMIN_EMAIL=admin@yourdomain.com

# PayPal (optional)
PAYPAL_ME_USERNAME=YourPayPalUsername

# iCloud Contacts (optional)
ICLOUD_EMAIL=your@icloud.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Key Backend Endpoints:

```
POST /api/bookings              - Create booking
GET  /api/bookings              - List all bookings (admin)
GET  /api/bookings/{id}         - Get single booking
PUT  /api/bookings/{id}         - Update booking
DELETE /api/bookings/{id}       - Soft-delete booking (moves to deleted_bookings)

GET  /api/bookings/deleted      - List deleted bookings
POST /api/bookings/restore/{id} - Restore deleted booking
DELETE /api/bookings/permanent/{id} - Permanently delete

POST /api/calculate-price       - Calculate trip price
POST /api/admin/login           - Admin login (returns JWT)
POST /api/admin/register        - Create admin user

GET  /api/drivers               - List drivers
POST /api/drivers               - Create driver
PATCH /api/drivers/{id}/assign  - Assign driver to booking

GET  /api/flight/track          - Track flight status
POST /api/email/incoming        - Webhook for AI email responder
```

---

## 6. FRONTEND SETUP

### Environment Variables (`/app/frontend/.env`):

```env
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Key Components to Build:

```
/src/components/
├── Header.jsx              - Navigation with logo, menu links
├── Footer.jsx              - Footer with contact info, links
├── PageBreadcrumb.jsx      - Breadcrumb navigation (Home > Services > etc)
├── BookingForm.jsx         - Main booking form
├── PriceCalculator.jsx     - Real-time price display
├── FlightTracker.jsx       - Flight status lookup
├── AIChatbot.jsx           - Floating AI chat widget
├── WhatsAppButton.jsx      - WhatsApp click-to-chat
├── GoogleReviews.jsx       - Reviews widget
└── ui/                     - Shadcn UI components

/src/pages/
├── Home.jsx                - Homepage with hero, features
├── BookNow.jsx             - Booking form page
├── Services.jsx            - Services overview
├── HobbitonTransfers.jsx   - Hobbiton-specific page
├── CruiseTransfers.jsx     - Cruise transfers page
├── FlightTrackerPage.jsx   - Flight tracker page
├── TravelResourcesPage.jsx - Travel guide
├── InternationalVisitors.jsx - For international tourists
├── About.jsx               - About us
├── Contact.jsx             - Contact page
├── AdminDashboard.jsx      - Admin panel (LARGE file)
└── markets/                - Country-specific landing pages
    ├── ChinaLanding.jsx
    ├── JapanLanding.jsx
    └── etc.
```

---

## 7. ADMIN DASHBOARD FEATURES

### Tabs in Admin Dashboard:

1. **Bookings Tab**
   - List all bookings with search/filter
   - Click to view/edit booking details
   - Assign drivers to bookings
   - Send confirmation emails
   - Export to CSV

2. **Deleted Tab** (NEW - Soft Delete Recovery)
   - Shows all deleted bookings
   - "Restore" button to recover booking
   - "Delete Forever" for permanent removal
   - Prevents accidental data loss

3. **Analytics Tab**
   - Total bookings count
   - Revenue (confirmed bookings only)
   - Bookings by status chart
   - Daily booking trends

4. **Customers Tab**
   - Customer list from all bookings
   - Search by name/email/phone
   - View customer booking history

5. **Drivers Tab**
   - Add/edit/remove drivers
   - View driver assignments
   - Set driver passwords
   - Track assigned jobs per driver

6. **Applications Tab**
   - Driver job applications
   - Review and approve/reject

7. **Marketing Tab**
   - SEO landing pages management
   - Facebook strategy content

### Admin Header Buttons:
- **View Site** - Opens homepage in new tab
- **Sync to iPhone** - Bulk sync all contacts to iCloud
- **Driver Portal** - Link to driver login
- **SEO Management** - Manage landing pages
- **Facebook Strategy** - Marketing content
- **Change Password**
- **Logout**

---

## 8. PRICING SYSTEM

### How Pricing Works:

```python
# Base rates
BASE_RATE_FIRST_10KM = 5.00   # $5/km for first 10km
BASE_RATE_NEXT_15KM = 4.00    # $4/km for 11-25km
BASE_RATE_OVER_25KM = 3.50    # $3.50/km for 25km+
MINIMUM_FARE = 100.00          # Minimum $100

# Calculation steps:
1. Get distance from Google Maps Distance Matrix API
2. Calculate base price using tiered rates
3. Apply minimum fare if needed
4. Double for return trips
5. Return total + breakdown
```

### Special Pricing Rules:

```python
# Concert venue special pricing (Matakana Country Park)
if "matakana country park" in dropoff.lower():
    return 550.00  # Fixed concert price

# Apply minimum fare
if calculated_price < 100:
    return 100.00
```

### API Request:
```json
POST /api/calculate-price
{
  "pickupAddress": "123 Queen St, Auckland CBD",
  "dropoffAddress": "Auckland Airport",
  "passengers": 2,
  "bookReturn": false
}
```

### API Response:
```json
{
  "totalPrice": 150.00,
  "basePrice": 150.00,
  "distance": 25.5,
  "duration": "35 mins",
  "ratePerKm": 3.50,
  "breakdown": {
    "first10km": 50.00,
    "next15km": 60.00,
    "remaining": 40.00
  }
}
```

---

## 9. BOOKING FLOW

### Step-by-Step Customer Journey:

1. **Customer visits homepage** → Sees hero, "Book Now" CTA
2. **Clicks "Book Now"** → Goes to /book-now
3. **Fills booking form:**
   - Pickup address (Google Places autocomplete)
   - Additional stops (optional, up to 3)
   - Dropoff address
   - Date & time
   - Number of passengers
   - Flight details (optional)
   - Return trip toggle
4. **Price calculates in real-time** as they type addresses
5. **Selects payment method:**
   - Pay Online (Stripe) → Redirects to Stripe checkout
   - PayPal → Shows PayPal.me link
   - Cash → Books directly
   - Afterpay → Creates Afterpay checkout
6. **Booking confirmed:**
   - Customer receives confirmation email
   - Customer receives SMS confirmation
   - Admin receives notification email
   - Booking added to Google Calendar
   - Contact synced to iCloud

### Backend Booking Creation:
```python
@api_router.post("/bookings")
async def create_booking(booking: BookingCreate):
    # 1. Generate reference number
    # 2. Save to database
    # 3. Send admin notification email
    # 4. Create Google Calendar event
    # 5. Sync contact to iCloud
    # 6. Return booking object
```

---

## 10. NOTIFICATIONS SYSTEM

### Email Notifications (via Mailgun):

| Trigger | Recipient | Template |
|---------|-----------|----------|
| New booking | Admin | "New Booking Alert" with all details |
| Booking confirmed | Customer | Confirmation with booking details |
| Driver assigned | Driver | Job assignment with pickup details |
| Day-before reminder | Customer | Reminder 24hrs before pickup |
| Booking cancelled | Customer | Cancellation confirmation |

### SMS Notifications (via Twilio):

| Trigger | Recipient | Message |
|---------|-----------|---------|
| Booking confirmed | Customer | "Your booking #123 is confirmed for Dec 25 at 10:00" |
| Driver assigned | Driver | "New job assigned: Pickup at 123 Main St..." |
| Day-before reminder | Customer | "Reminder: Your airport transfer is tomorrow at 10:00" |

### Phone Number Formatting:
```python
# Always convert to E.164 format for Twilio
def format_nz_phone(phone: str) -> str:
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('64'):
        return f'+{digits}'
    if digits.startswith('0'):
        return f'+64{digits[1:]}'
    return f'+64{digits}'
```

---

## 11. DRIVER MANAGEMENT

### Driver Portal Features:
- Login with email/password
- View assigned jobs
- See job details (pickup, dropoff, customer phone)
- Google Maps navigation links
- Earnings calculation (85% of fare)

### Assigning Drivers:
1. Admin goes to booking in dashboard
2. Selects driver from dropdown
3. Clicks "Assign Driver"
4. Backend:
   - Updates booking with driver_id, driver_name, driver_phone
   - Sends email notification to driver
   - Sends SMS notification to driver

### Driver Notification Content:
```
New Job Assignment!

Booking #123
Date: Dec 25, 2025 at 10:00

Customer: John Smith
Phone: +64211234567

Pickup: 123 Main St, Auckland
Dropoff: Auckland Airport

Passengers: 2
Your Earnings: $127.50

View in portal: https://yourdomain.com/driver/portal
```

---

## 12. INTEGRATIONS

### Google Maps
- **Distance Matrix API** - Calculate trip distance/duration
- **Places API** - Address autocomplete
- **Frontend:** Use `@react-google-maps/api` library

### Stripe Payments
```javascript
// Frontend: Create checkout
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({ bookingId, amount })
});
const { url } = await response.json();
window.location.href = url;  // Redirect to Stripe
```

### Twilio SMS
```python
from twilio.rest import Client

client = Client(TWILIO_SID, TWILIO_TOKEN)
client.messages.create(
    body="Your booking is confirmed!",
    from_=TWILIO_PHONE,
    to="+64211234567"
)
```

### Mailgun Email
```python
import requests

def send_email(to, subject, html):
    return requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": f"BookaRide <noreply@{MAILGUN_DOMAIN}>",
            "to": to,
            "subject": subject,
            "html": html
        }
    )
```

### iCloud Contacts
```python
# Uses CardDAV protocol
# Sync customer contacts to iPhone automatically
```

### AviationStack Flight Tracking
```python
response = requests.get(
    "http://api.aviationstack.com/v1/flights",
    params={
        "access_key": AVIATIONSTACK_KEY,
        "flight_iata": "NZ123"
    }
)
```

### AI Chatbot (OpenAI via Emergent)
```python
from emergentintegrations.llm.chat import chat

response = chat(
    api_key=EMERGENT_LLM_KEY,
    prompt="Help customer with booking question",
    user_message=customer_question
)
```

---

## 13. PAGES TO BUILD

### Public Pages:

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Hero, features, testimonials, CTA |
| Book Now | `/book-now` | Booking form |
| Services | `/services` | Service overview |
| Hobbiton | `/hobbiton-transfers` | Hobbiton-specific |
| Cruise | `/cruise-transfers` | Cruise transfers |
| Flight Tracker | `/flight-tracker` | Flight status lookup |
| Travel Guide | `/travel-guide` | Airport tips, NZ info |
| International | `/international-visitors` | For tourists |
| About | `/about` | About the company |
| Contact | `/contact` | Contact form |

### Admin Pages:

| Page | Route | Access |
|------|-------|--------|
| Admin Login | `/admin/login` | Public |
| Admin Dashboard | `/admin/dashboard` | Admin only |
| SEO Management | `/admin/seo` | Admin only |
| Driver Portal | `/driver/portal` | Drivers only |

### All pages need:
- SEO component with title, description, keywords
- PageBreadcrumb component (Home > Page Name)
- Responsive design (mobile-first)
- Consistent header/footer

---

## 14. DESIGN SYSTEM

### Colors:
```css
/* Primary */
--gold: #D4AF37;
--gold-hover: #B8960C;

/* Backgrounds */
--bg-dark: #111827;      /* Gray-900 */
--bg-light: #F9FAFB;     /* Gray-50 */

/* Text */
--text-primary: #111827;  /* Gray-900 */
--text-secondary: #6B7280; /* Gray-500 */
--text-light: #FFFFFF;
```

### Typography:
```css
/* Headings */
H1: text-4xl sm:text-5xl lg:text-6xl font-bold
H2: text-2xl sm:text-3xl font-bold
H3: text-xl font-semibold

/* Body */
Body: text-base text-gray-600
Small: text-sm text-gray-500
```

### Buttons:
```jsx
// Primary (Gold)
<Button className="bg-gold hover:bg-gold/90 text-black">
  Book Now
</Button>

// Outline
<Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
  Learn More
</Button>
```

### Cards:
```jsx
<Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
  <CardContent className="p-6">
    ...
  </CardContent>
</Card>
```

---

## 15. TESTING CHECKLIST

### Before Going Live:

**Backend:**
- [ ] Price calculation returns correct amounts
- [ ] Booking creation works with all fields
- [ ] Return trips calculate 2x price
- [ ] Email sending works (check spam folder)
- [ ] SMS sending works
- [ ] Admin login/logout works
- [ ] Driver assignment saves correctly
- [ ] Soft-delete moves to deleted_bookings
- [ ] Restore brings booking back
- [ ] Flight tracking API returns data

**Frontend:**
- [ ] Homepage loads without errors
- [ ] All navigation links work
- [ ] Breadcrumbs show on all pages
- [ ] Booking form validates required fields
- [ ] Google Places autocomplete works
- [ ] Price updates when addresses change
- [ ] Payment buttons work (test mode first)
- [ ] Mobile responsive on all pages
- [ ] Admin dashboard loads all tabs
- [ ] Deleted tab shows/restores bookings
- [ ] Driver assignment works from admin

**Integrations:**
- [ ] Google Maps API key works
- [ ] Stripe test payment succeeds
- [ ] Twilio sends test SMS
- [ ] Mailgun sends test email
- [ ] Flight tracker returns real data

---

## QUICK START COMMANDS

```bash
# Install backend dependencies
cd /app/backend && pip install -r requirements.txt

# Install frontend dependencies  
cd /app/frontend && yarn install

# Restart services
sudo supervisorctl restart backend frontend

# Check logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log

# Create admin user
curl -X POST "https://yourdomain.com/api/admin/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@domain.com","password":"SecurePassword123"}'

# Test pricing
curl -X POST "https://yourdomain.com/api/calculate-price" \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress":"Auckland CBD","dropoffAddress":"Auckland Airport","passengers":2}'
```

---

## SUPPORT

If you're building this for another domain:
1. Replace all instances of "bookaride.co.nz" with your domain
2. Update all API keys for your accounts
3. Configure Mailgun for your domain (MX records)
4. Set up Twilio with your phone number
5. Update Google OAuth redirect URLs if using

**Questions?** Email support@emergent.sh

---

**Document Version:** 2.0
**Last Updated:** December 2025
**Based on:** BookaRide.co.nz production site
