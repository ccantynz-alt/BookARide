# Backend Module Structure
# This file documents the planned modular architecture

## Current State
- server.py: 12,615 lines (monolithic)

## Planned Structure
/app/backend/
├── server.py              # Main FastAPI app, imports from modules
├── routes/
│   ├── __init__.py
│   ├── auth.py            # Admin/Driver authentication
│   ├── bookings.py        # Booking CRUD operations
│   ├── payments.py        # Stripe, Afterpay, payment links
│   ├── drivers.py         # Driver management
│   ├── calendar.py        # Google Calendar integration
│   └── notifications.py   # Email/SMS sending
├── services/
│   ├── __init__.py
│   ├── pricing.py         # Price calculation logic
│   ├── email_service.py   # Mailgun integration
│   ├── sms_service.py     # Twilio integration
│   └── calendar_service.py # Google Calendar service
├── models/
│   ├── __init__.py
│   ├── booking.py         # Booking Pydantic models
│   ├── driver.py          # Driver Pydantic models
│   └── admin.py           # Admin Pydantic models
└── utils/
    ├── __init__.py
    ├── phone.py           # Phone number formatting
    └── date_utils.py      # Date/time utilities

## Migration Strategy
1. Create module files with extracted code
2. Import modules in server.py
3. Gradually replace inline code with module calls
4. Test each migration step thoroughly
5. Keep backward compatibility during transition

## Priority Order
1. Models (lowest risk, highest reuse)
2. Services (business logic encapsulation)  
3. Utils (helper functions)
4. Routes (highest risk, most dependencies)
