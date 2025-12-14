# BookaRide NZ - System Documentation
## Complete Admin Panel & Booking System Reference

---

## 1. SYSTEM OVERVIEW

### Tech Stack
- **Frontend:** React 18 + TailwindCSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT tokens (admin), Email/Password (drivers)
- **Payments:** Stripe
- **Notifications:** Mailgun (email), Twilio (SMS)
- **Calendar:** Google Calendar API (service account)
- **Maps:** Google Maps API (autocomplete, distance calculation)

### Key URLs
- `/` - Public homepage
- `/book-now` - Customer booking form
- `/admin/login` - Admin login
- `/admin` - Admin dashboard
- `/driver/portal` - Driver login & schedule

---

## 2. DATABASE SCHEMAS

### Bookings Collection
```javascript
{
  id: "uuid-string",
  booking_ref: "ABC123",  // 6-char reference
  name: "Customer Name",
  email: "customer@email.com",
  phone: "+64 21 123 4567",
  
  // Trip Details
  pickupAddress: "123 Main St, Auckland",
  dropoffAddress: "Auckland Airport",
  pickupAddresses: ["Stop 1", "Stop 2"],  // Additional stops
  date: "2025-12-15",  // YYYY-MM-DD
  time: "14:30",
  passengers: 2,
  luggage: 3,
  
  // Return Trip (optional)
  bookReturn: true,
  returnDate: "2025-12-20",
  returnTime: "10:00",
  
  // Flight Info
  flightNumber: "NZ123",
  flightTime: "16:00",
  
  // Pricing
  pricing: {
    basePrice: 80,
    additionalStops: 20,
    returnTrip: 80,
    totalPrice: 180
  },
  totalPrice: 180,
  
  // Status
  status: "pending|confirmed|completed|cancelled",
  payment_status: "pending|paid|refunded",
  
  // Driver Assignment
  driver_id: "driver-uuid",
  driver_name: "John Smith",
  
  // Metadata
  created_at: "2025-12-14T10:30:00Z",
  reminderSentAt: "2025-12-14T08:00:00Z",
  calendar_event_ids: ["event1", "event2"],
  
  // Service Type
  serviceType: "private-transfer|shared-shuttle|cruise-transfer",
  
  // Special Requests
  specialRequests: "Child seat required",
  ccEmail: "copy@email.com"
}
```

### Drivers Collection
```javascript
{
  id: "uuid-string",
  name: "John Smith",
  email: "john@example.com",
  phone: "+64 21 555 1234",
  license_number: "DL123456",
  status: "active|inactive|on_leave",
  password_hash: "bcrypt-hashed-password",
  notes: "Preferred for airport runs",
  created_at: "2025-01-01T00:00:00Z"
}
```

### Driver Applications Collection
```javascript
{
  id: "uuid-string",
  name: "Applicant Name",
  email: "applicant@email.com",
  phone: "+64 21 999 8888",
  suburb: "Takapuna",
  vehicle_type: "Sedan",
  vehicle_year: "2020",
  experience: "5 years",
  availability: "Full-time",
  message: "Additional notes",
  status: "pending|reviewing|approved|rejected",
  notes: "Admin notes",
  created_at: "2025-12-14T10:00:00Z"
}
```

### Admins Collection
```javascript
{
  id: "uuid-string",
  username: "admin",
  password_hash: "bcrypt-hashed",
  email: "admin@bookaride.co.nz",
  created_at: "2025-01-01T00:00:00Z"
}
```

---

## 3. API ENDPOINTS

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (returns JWT) |
| POST | `/api/driver/login` | Driver login |
| POST | `/api/admin/change-password` | Change admin password |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings (admin auth) |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings/{id}` | Get single booking |
| PATCH | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}?send_notification=true` | Cancel/delete booking |
| PUT | `/api/bookings/{id}/payment-status` | Update payment status |
| POST | `/api/bookings/{id}/sync-calendar` | Sync to Google Calendar |
| POST | `/api/bookings/{id}/resend-confirmation` | Resend confirmation email |
| GET | `/api/bookings/{id}/preview-confirmation` | Preview email HTML |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | Get all drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/{id}` | Update driver |
| DELETE | `/api/drivers/{id}` | Delete driver |
| PATCH | `/api/drivers/{id}/assign?booking_id=xxx` | Assign driver to booking |
| POST | `/api/drivers/{id}/set-password` | Set driver portal password |
| GET | `/api/drivers/{id}/schedule` | Get driver's schedule |

### Driver Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/driver-applications` | List all applications |
| POST | `/api/driver-applications` | Submit application (public) |
| PATCH | `/api/driver-applications/{id}?status=xxx` | Update status |

### Pricing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculate-price` | Calculate trip price |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/send-reminders` | Manually send tomorrow's reminders |
| POST | `/api/send-booking-email` | Send custom email to customer |

### Stripe Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/create-payment-intent` | Create Stripe payment |
| POST | `/api/stripe-webhook` | Handle Stripe webhooks |

---

## 4. ADMIN PANEL FEATURES

### Dashboard Tabs
1. **Bookings** - View, edit, delete, filter bookings
2. **Analytics** - Revenue charts, booking trends
3. **Customers** - Customer list and history
4. **Drivers** - Manage drivers, set passwords
5. **Applications** - Review driver applications
6. **Marketing** - Landing pages management

### Booking Actions
- View booking details (modal)
- Edit booking (all fields editable)
- Assign driver (dropdown selection)
- Update status (pending/confirmed/completed/cancelled)
- Update payment status (pending/paid/refunded)
- Sync to Google Calendar
- Send/resend confirmation email
- Send custom email
- Delete with or without customer notification
- Bulk delete selected bookings
- Export to CSV

### Stats Cards (Gold themed)
- Total Bookings
- Pending Bookings
- Confirmed Bookings
- Total Revenue

### Header Buttons
- Driver Portal (link)
- SEO Management
- Facebook Strategy
- Change Password
- Logout

---

## 5. BOOKING FLOW

### Customer Journey
1. Customer visits `/book-now`
2. Fills in pickup/dropoff addresses (Google Autocomplete)
3. Adds optional stops
4. Selects date, time, passengers
5. Optional: Add return trip
6. Price calculated via API
7. Enters contact details
8. Pays via Stripe (or pay later)
9. Receives confirmation email + SMS
10. Receives reminder day before (8 AM automatic)

### Pricing Logic
```python
base_price = calculated_from_distance
additional_stops = $20 per extra stop
return_trip = base_price (if selected)
total = base_price + additional_stops + return_trip
```

### Email Notifications
- **Booking Confirmation** - Sent immediately after booking
- **Day-Before Reminder** - Automatic at 8 AM NZ time
- **Driver Assignment** - Sent to driver when assigned
- **Cancellation** - Optional when admin cancels

---

## 6. DRIVER MANAGEMENT

### Driver Portal (`/driver/portal`)
- Login with email + password
- View assigned bookings
- See customer contact info
- View pickup/dropoff details
- Filter by date

### Admin Driver Features
- Add/edit/delete drivers
- Set portal passwords (key icon)
- Assign drivers to bookings
- View driver's schedule

### Driver Assignment Flow
1. Admin opens booking
2. Clicks "Assign Driver" 
3. Selects driver from dropdown
4. Driver receives email notification
5. Booking shows driver name
6. Driver sees job in portal

---

## 7. AUTOMATED SYSTEMS

### Scheduled Tasks (APScheduler)
- **Daily Reminders**: 8:00 AM NZ time
  - Finds bookings for tomorrow
  - Sends email reminder
  - Sends SMS reminder
  - Marks `reminderSentAt` to prevent duplicates

### Google Calendar Sync
- Creates calendar event when booking synced
- For return trips: Creates 2 separate events
- Includes all trip details in event description
- Uses service account authentication

---

## 8. INTEGRATIONS

### Google Maps API
- Address autocomplete
- Distance calculation
- Used in: BookNow page, Admin booking form

### Stripe
- Payment intents
- Webhook handling for payment confirmation
- Test mode available

### Mailgun
- Transactional emails
- HTML templates with gold branding
- Booking confirmations, reminders, notifications

### Twilio
- SMS notifications
- Booking confirmations
- Day-before reminders

### Google Calendar
- Service account authentication
- Event creation for bookings
- Separate events for outbound/return trips

---

## 9. KEY FRONTEND COMPONENTS

### Pages
- `BookNow.jsx` - Customer booking form
- `AdminDashboard.jsx` - Main admin panel (~2600 lines)
- `DriverPortal.jsx` - Driver login and schedule
- `DriveWithUs.jsx` - Driver recruitment page

### Admin Components (`/components/admin/`)
- `DriversTab.jsx` - Driver management
- `DriverApplicationsTab.jsx` - Application review
- `AnalyticsTab.jsx` - Charts and stats
- `CustomersTab.jsx` - Customer list
- `AdminBreadcrumb.jsx` - Navigation breadcrumb

### UI Components (`/components/ui/`)
- Shadcn components: Button, Card, Dialog, Input, Select, Tabs, etc.
- Custom: SEO component, BackToTop, AdminBackButton

---

## 10. STYLING GUIDE

### Brand Colors
- **Gold**: `#D4AF37` (primary accent)
- **Black**: `#1a1a1a` (headers, dark sections)
- **White**: `#ffffff` (text on gold/dark)

### Admin Panel Theme
- Gold breadcrumb with white text
- Gold stat cards with white text
- Dark header gradient
- Professional icons (no emojis in UI)

### Tailwind Classes
```css
bg-gold          /* Gold background */
text-gold        /* Gold text */
border-gold      /* Gold border */
hover:bg-gold/90 /* Gold hover state */
text-white/80    /* Semi-transparent white */
```

---

## 11. ENVIRONMENT VARIABLES

### Backend (.env)
```
MONGO_URL=mongodb://...
DB_NAME=bookaride
STRIPE_SECRET_KEY=sk_...
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.bookaride.co.nz
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+64...
GOOGLE_MAPS_API_KEY=...
GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://bookaride.co.nz
REACT_APP_GOOGLE_MAPS_API_KEY=...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 12. QUICK START FOR NEW BUILD

1. Set up MongoDB database
2. Configure environment variables
3. Install backend: `pip install -r requirements.txt`
4. Install frontend: `yarn install`
5. Create default admin: Auto-created on first run (admin/admin)
6. Configure Stripe, Mailgun, Twilio, Google APIs
7. Run backend: `uvicorn server:app --host 0.0.0.0 --port 8001`
8. Run frontend: `yarn start`

---

*Document generated for BookaRide NZ - December 2025*
