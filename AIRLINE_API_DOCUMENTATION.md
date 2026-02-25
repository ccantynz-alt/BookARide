# BookaRide Airline Partnership API Documentation

## Overview
The BookaRide Airline Partnership API allows airlines to integrate ground transportation booking into their checkout flow. This enables passengers to book airport transfers directly when purchasing flights.

**Base URL:** `https://bookaride.co.nz/api/airline/v1`

**API Version:** 1.0

## Authentication
All API requests require an API key passed in the header:
```
X-API-Key: your_api_key_here
```

To obtain an API key, contact our partnerships team at partners@bookaride.co.nz

## Endpoints

### 1. Health Check
Check API availability.

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0",
  "service": "bookaride-airline-api"
}
```

---

### 2. Check Availability & Get Quote
Get real-time pricing and availability for a transfer.

```
POST /availability
```

**Request Body:**
```json
{
  "pickup_location": "Auckland International Airport, New Zealand",
  "dropoff_location": "SkyCity Hotel, Auckland CBD",
  "pickup_datetime": "2026-01-15T14:30:00+13:00",
  "passengers": 2,
  "flight_number": "NZ123"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pickup_location | string | Yes | Full address or airport name |
| dropoff_location | string | Yes | Full address or hotel name |
| pickup_datetime | string | Yes | ISO 8601 format with timezone |
| passengers | integer | Yes | Number of passengers (1-8) |
| flight_number | string | No | For flight tracking |

**Response:**
```json
{
  "available": true,
  "quote": {
    "currency": "NZD",
    "amount": 95.00,
    "distance_km": 25.5,
    "estimated_duration_minutes": 35,
    "vehicle_type": "sedan",
    "valid_until": "2026-01-15T12:00:00Z"
  },
  "pickup_location": "Auckland International Airport, New Zealand",
  "dropoff_location": "SkyCity Hotel, Auckland CBD"
}
```

---

### 3. Create Booking
Create a confirmed booking.

```
POST /book
```

**Request Body:**
```json
{
  "pickup_location": "Auckland International Airport, New Zealand",
  "dropoff_location": "SkyCity Hotel, Auckland CBD",
  "pickup_datetime": "2026-01-15T14:30:00+13:00",
  "passengers": 2,
  "customer_name": "John Smith",
  "customer_email": "john.smith@email.com",
  "customer_phone": "+64211234567",
  "flight_number": "NZ123",
  "pnr": "ABC123"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pickup_location | string | Yes | Full address |
| dropoff_location | string | Yes | Full address |
| pickup_datetime | string | Yes | ISO 8601 format |
| passengers | integer | Yes | Number of passengers |
| customer_name | string | Yes | Passenger's full name |
| customer_email | string | Yes | For confirmation email |
| customer_phone | string | Yes | For driver contact |
| flight_number | string | No | For flight tracking |
| pnr | string | No | Airline booking reference |

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid-here",
    "reference_number": 12345,
    "status": "confirmed",
    "pickup_date": "2026-01-15",
    "pickup_time": "14:30"
  }
}
```

---

### 4. Get Booking Status
Retrieve booking details and status.

```
GET /booking/{booking_id}
```

**Response:**
```json
{
  "id": "uuid-here",
  "reference_number": 12345,
  "status": "confirmed",
  "pickup_date": "2026-01-15",
  "pickup_time": "14:30",
  "pickup_location": "Auckland International Airport",
  "dropoff_location": "SkyCity Hotel, Auckland CBD",
  "driver_name": "Craig",
  "driver_phone": "+6421339030"
}
```

**Status Values:**
- `pending` - Awaiting confirmation
- `confirmed` - Booking confirmed, driver assigned
- `in_progress` - Driver en route or passenger picked up
- `completed` - Transfer completed
- `cancelled` - Booking cancelled

---

### 5. Cancel Booking
Cancel an existing booking.

```
DELETE /booking/{booking_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled"
}
```

---

## Error Responses

All errors return a JSON object with a `detail` field:

```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid/missing API key)
- `404` - Resource not found
- `500` - Server error

---

## Rate Limits
- 100 requests per minute per API key
- 10,000 requests per day per API key

---

## Webhooks (Optional)
We can send booking status updates to your webhook URL. Contact us to set up webhooks.

**Webhook Events:**
- `booking.confirmed` - Driver assigned
- `booking.driver_enroute` - Driver on the way
- `booking.completed` - Transfer completed
- `booking.cancelled` - Booking cancelled

---

## Test Environment
For testing, use:
- **Base URL:** `https://dazzling-leakey.preview.emergentagent.com/api/airline/v1`
- Contact us for test API credentials

---

## Support
- **Email:** api-support@bookaride.co.nz
- **Phone:** +64 21 339 030
- **Documentation:** https://bookaride.co.nz/api-docs

---

## Code Examples

### Python
```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://bookaride.co.nz/api/airline/v1"

headers = {"X-API-Key": API_KEY}

# Check availability
response = requests.post(
    f"{BASE_URL}/availability",
    headers=headers,
    json={
        "pickup_location": "Auckland Airport",
        "dropoff_location": "Auckland CBD",
        "pickup_datetime": "2026-01-15T14:30:00+13:00",
        "passengers": 2
    }
)
print(response.json())
```

### JavaScript
```javascript
const API_KEY = 'your_api_key';
const BASE_URL = 'https://bookaride.co.nz/api/airline/v1';

// Check availability
fetch(`${BASE_URL}/availability`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pickup_location: 'Auckland Airport',
    dropoff_location: 'Auckland CBD',
    pickup_datetime: '2026-01-15T14:30:00+13:00',
    passengers: 2
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

*Last updated: 4 January 2026*
