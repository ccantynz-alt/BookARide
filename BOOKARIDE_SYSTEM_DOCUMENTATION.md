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
  booking_ref: "ABC123",
  name: "Customer Name",
  email: "customer@email.com",
  phone: "+64 21 123 4567",
  pickupAddress: "123 Main St, Auckland",
  dropoffAddress: "Auckland Airport",
  pickupAddresses: ["Stop 1", "Stop 2"],
  date: "2025-12-15",
  time: "14:30",
  passengers: 2,
  luggage: 3,
  bookReturn: true,
  returnDate: "2025-12-20",
  returnTime: "10:00",
  flightNumber: "NZ123",
  flightTime: "16:00",
  pricing: {
    basePrice: 80,
    additionalStops: 20,
    returnTrip: 80,
    totalPrice: 180
  },
  totalPrice: 180,
  status: "pending|confirmed|completed|cancelled",
  payment_status: "pending|paid|refunded",
  driver_id: "driver-uuid",
  driver_name: "John Smith",
  created_at: "2025-12-14T10:30:00Z",
  reminderSentAt: "2025-12-14T08:00:00Z",
  calendar_event_ids: ["event1", "event2"],
  serviceType: "private-transfer|shared-shuttle|cruise-transfer",
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

---

## 3. API ENDPOINTS

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login (returns JWT) |
| POST | /api/driver/login | Driver login |
| POST | /api/admin/change-password | Change admin password |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bookings | Get all bookings (admin auth) |
| POST | /api/bookings | Create new booking |
| GET | /api/bookings/{id} | Get single booking |
| PATCH | /api/bookings/{id} | Update booking |
| DELETE | /api/bookings/{id}?send_notification=true | Cancel/delete booking |
| PUT | /api/bookings/{id}/payment-status | Update payment status |
| POST | /api/bookings/{id}/sync-calendar | Sync to Google Calendar |
| POST | /api/bookings/{id}/resend-confirmation | Resend confirmation email |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/drivers | Get all drivers |
| POST | /api/drivers | Create driver |
| PUT | /api/drivers/{id} | Update driver |
| DELETE | /api/drivers/{id} | Delete driver |
| PATCH | /api/drivers/{id}/assign?booking_id=xxx | Assign driver to booking |
| POST | /api/drivers/{id}/set-password | Set driver portal password |

### Driver Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/driver-applications | List all applications |
| POST | /api/driver-applications | Submit application (public) |
| PATCH | /api/driver-applications/{id}?status=xxx | Update status |

### Pricing & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/calculate-price | Calculate trip price |
| POST | /api/create-payment-intent | Create Stripe payment |
| POST | /api/stripe-webhook | Handle Stripe webhooks |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/send-reminders | Manually send tomorrow reminders |
| POST | /api/send-booking-email | Send custom email to customer |

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
- View/Edit booking details
- Assign driver
- Update status (pending/confirmed/completed/cancelled)
- Update payment status (pending/paid/refunded)
- Sync to Google Calendar
- Send/resend confirmation email
- Delete with or without customer notification
- Bulk delete, Export to CSV

### Header Buttons
- Driver Portal link
- SEO Management
- Facebook Strategy
- Change Password
- Logout

---

## 5. BOOKING FLOW

1. Customer visits /book-now
2. Fills pickup/dropoff (Google Autocomplete)
3. Adds optional stops
4. Selects date, time, passengers
5. Optional: Add return trip
6. Price calculated via API
7. Enters contact details
8. Pays via Stripe (or pay later)
9. Receives confirmation email + SMS
10. Receives reminder day before (8 AM automatic)

### Pricing Logic
- base_price = calculated from distance
- additional_stops = $20 per extra stop
- return_trip = base_price (if selected)
- total = base + stops + return

---

## 6. DRIVER MANAGEMENT

### Driver Portal (/driver/portal)
- Login with email + password
- View assigned bookings
- See customer contact info
- View pickup/dropoff details

### Admin Features
- Add/edit/delete drivers
- Set portal passwords (key icon)
- Assign drivers to bookings

---

## 7. AUTOMATED SYSTEMS

### Daily Reminders (8:00 AM NZ time)
- Finds bookings for tomorrow
- Sends email + SMS reminder
- Prevents duplicate sends

### Google Calendar Sync
- Creates event when booking synced
- Return trips: 2 separate events
- Uses service account auth

---

## 8. INTEGRATIONS

- **Google Maps API** - Address autocomplete, distance calc
- **Stripe** - Payment processing
- **Mailgun** - Email notifications
- **Twilio** - SMS notifications
- **Google Calendar** - Event sync

---

## 9. STYLING GUIDE

### Brand Colors
- Gold: #D4AF37
- Black: #1a1a1a
- White: #ffffff

### Tailwind Classes
- bg-gold, text-gold, border-gold
- hover:bg-gold/90
- text-white/80

---

## 10. ENVIRONMENT VARIABLES

### Backend
- MONGO_URL, DB_NAME
- STRIPE_SECRET_KEY
- MAILGUN_API_KEY, MAILGUN_DOMAIN
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- GOOGLE_MAPS_API_KEY
- GOOGLE_SERVICE_ACCOUNT (JSON)

### Frontend
- REACT_APP_BACKEND_URL
- REACT_APP_GOOGLE_MAPS_API_KEY
- REACT_APP_STRIPE_PUBLISHABLE_KEY

---

*Document generated for BookaRide NZ - December 2025*
