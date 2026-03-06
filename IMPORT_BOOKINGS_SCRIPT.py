"""
BookaRide Booking Import Script
Imports hardcoded historical bookings into the Neon PostgreSQL database.

Usage:
  python IMPORT_BOOKINGS_SCRIPT.py

Environment variables (required):
  DATABASE_URL  - Neon/PostgreSQL connection string
                  e.g. postgresql://user:pass@host/dbname

Optional:
  DRY_RUN=1     - Print what would be imported without writing to DB
"""

import asyncio
import asyncpg
import json
import os
import sys
from datetime import datetime
from uuid import uuid4

DATABASE_URL = os.environ.get('DATABASE_URL', '')
DRY_RUN = os.environ.get('DRY_RUN', '').strip() in ('1', 'true', 'yes')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is required.")
    print("  export DATABASE_URL='postgresql://user:pass@host/dbname'")
    sys.exit(1)


def _json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# All bookings to import (no notifications will be sent)
BOOKINGS = [
    # OUTBOUND TRIPS
    {
        "referenceNumber": 52765,
        "serviceType": "Airport Drop-off",
        "name": "Daniel Grimshaw",
        "email": "grimandco@icloud.com",
        "phone": "+6421993326",
        "pickupAddress": "19 Bella Vista Drive, Gulf Harbour, Whangaparāoa, New Zealand",
        "dropoffAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "pickupAddresses": ["4 Blue Heron Rise, Stanmore Bay, Whangaparāoa, New Zealand"],
        "date": "2025-12-19",
        "time": "04:45",
        "passengers": "8",
        "totalPrice": 217.10,
        "distance": 71.7,
        "duration": "01:06",
        "departureFlightNumber": "NZ946",
        "departureTime": "8:50am",
        "arrivalFlightNumber": "NZ945",
        "arrivalTime": "6:10pm",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": ""
    },
    {
        "referenceNumber": 52743,
        "serviceType": "Airport Drop-off",
        "name": "Crystal Galvin",
        "email": "Crystalgalvin1@bigpond.com",
        "phone": "+61413637765",
        "pickupAddress": "231 Vipond Road, Stanmore Bay, Whangaparāoa, New Zealand",
        "dropoffAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-22",
        "time": "04:00",
        "passengers": "2",
        "totalPrice": 164.38,
        "distance": 62.5,
        "duration": "00:53",
        "departureFlightNumber": "JQ132",
        "departureTime": "7:15am",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "driverName": "Craig Canty",
        "bookReturn": True,
        "returnDate": "2026-01-10",
        "returnTime": "00:45",
        "comment": "Looking to book for my elderly parents to shuttle from Stanmore Bay to Auckland International airport"
    },
    {
        "referenceNumber": 52735,
        "serviceType": "Airport Drop-off",
        "name": "Terrence Phoon",
        "email": "terrencephoon@gmail.com",
        "phone": "+64211050557",
        "pickupAddress": "51 Surf View Crescent, Red Beach, New Zealand",
        "dropoffAddress": "Auckland International Airport, Auckland, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-22",
        "time": "19:45",
        "passengers": "4",
        "totalPrice": 172.36,
        "distance": 58.6,
        "duration": "00:49",
        "departureFlightNumber": "NZ289",
        "departureTime": "11:55pm",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "driverName": "Craig Canty",
        "bookReturn": True,
        "returnDate": "2026-01-14",
        "returnTime": "12:15",
        "comment": ""
    },
    {
        "referenceNumber": 52715,
        "serviceType": "Airport Pickup",
        "name": "Malcolm Crum",
        "email": "crummynz@gmail.com",
        "phone": "+64212348790",
        "pickupAddress": "Auckland Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "dropoffAddress": "199A Proctor Rd, Orini, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-22",
        "time": "21:00",
        "passengers": "4",
        "totalPrice": 276.77,
        "distance": 95.1,
        "duration": "01:10",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "NZ5414",
        "arrivalTime": "8:55pm",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": "2 adults, 2 toddlers (with car seats)"
    },
    {
        "referenceNumber": 52707,
        "serviceType": "Airport Pickup",
        "name": "Simon Sheppard",
        "email": "mail_si@yahoo.com",
        "phone": "+64211378320",
        "pickupAddress": "Auckland Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "dropoffAddress": "Taupo, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-24",
        "time": "11:00",
        "passengers": "4",
        "totalPrice": 927.55,
        "distance": 259.3,
        "duration": "03:01",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "AA83",
        "arrivalTime": "9:55am",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": "Arriving from the US with three children. Staying with family in Taupo. US number: 001 201-780-8880. Can contact via WhatsApp when clearing customs."
    },
    {
        "referenceNumber": 14446,
        "serviceType": "Airport Drop-off",
        "name": "Sarah Kneller",
        "email": "sarahkneller96@gmail.com",
        "phone": "+64210658286",
        "pickupAddress": "14B Makomako Drive, Orewa, New Zealand",
        "dropoffAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-26",
        "time": "06:00",
        "passengers": "2",
        "totalPrice": 164.87,
        "distance": 62.7,
        "duration": "00:51",
        "departureFlightNumber": "NZ99",
        "departureTime": "10:05am",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": ""
    },
    {
        "referenceNumber": 14427,
        "serviceType": "Airport Drop-off",
        "name": "Sarah Lynn",
        "email": "s.lynn8219@gmail.com",
        "phone": "+64211490149",
        "pickupAddress": "23 Totara Views Drive, Red Beach, New Zealand",
        "dropoffAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "pickupAddresses": [],
        "date": "2026-01-19",
        "time": "04:30",
        "passengers": "8",
        "totalPrice": 191.32,
        "distance": 58.2,
        "duration": "00:48",
        "departureFlightNumber": "NZ946",
        "departureTime": "8:50am",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "driverName": "Craig Canty",
        "bookReturn": True,
        "returnDate": "2026-01-28",
        "returnTime": "18:30",
        "comment": ""
    },
    {
        "referenceNumber": 11710,
        "serviceType": "Airport Pickup",
        "name": "Gordon Trotter",
        "email": "gordon@trodigy.com",
        "phone": "+15163767889",
        "pickupAddress": "Auckland Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "dropoffAddress": "Ferry Building, Quay Street, Auckland Central, Auckland, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-19",
        "time": "10:30",
        "passengers": "5",
        "totalPrice": 169.50,
        "distance": 28.9,
        "duration": "00:31",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "AA83",
        "arrivalTime": "10:00am",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": "Family of 5 arriving international terminal from LAX. Going to Fullers Ferry Terminal to Waiheke."
    },
    {
        "referenceNumber": 11711,
        "serviceType": "Point to Point",
        "name": "Gordon Trotter",
        "email": "gordon@trodigy.com",
        "phone": "+15163767889",
        "pickupAddress": "Devonport Ferry Terminal, Victoria Road, Devonport, Auckland, New Zealand",
        "dropoffAddress": "40 Amorino Drive, Red Beach, New Zealand",
        "pickupAddresses": [],
        "date": "2025-12-24",
        "time": "12:30",
        "passengers": "5",
        "totalPrice": 195.00,
        "distance": 34,
        "duration": "00:36",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "",
        "arrivalTime": "12:40pm",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "comment": "Pickup from Ferry Terminal - arriving on Ferry from Waiheke, 12pm Departure time Waiheke"
    },
    # RETURN TRIPS (separate bookings)
    {
        "referenceNumber": 527439,
        "serviceType": "Airport Pickup",
        "name": "Crystal Galvin",
        "email": "Crystalgalvin1@bigpond.com",
        "phone": "+61413637765",
        "pickupAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "dropoffAddress": "231 Vipond Road, Stanmore Bay, Whangaparāoa, New Zealand",
        "pickupAddresses": [],
        "date": "2026-01-10",
        "time": "00:45",
        "passengers": "2",
        "totalPrice": 164.38,
        "distance": 62.5,
        "duration": "00:53",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "JQ133",
        "arrivalTime": "00:15am",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "linkedBooking": "52743",
        "comment": "RETURN TRIP - Elderly parents shuttle"
    },
    {
        "referenceNumber": 527359,
        "serviceType": "Airport Pickup",
        "name": "Terrence Phoon",
        "email": "terrencephoon@gmail.com",
        "phone": "+64211050557",
        "pickupAddress": "Auckland International Airport, Auckland, New Zealand",
        "dropoffAddress": "51 Surf View Crescent, Red Beach, New Zealand",
        "pickupAddresses": [],
        "date": "2026-01-14",
        "time": "12:15",
        "passengers": "4",
        "totalPrice": 172.36,
        "distance": 58.6,
        "duration": "00:49",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "MH145",
        "arrivalTime": "12:15pm",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "linkedBooking": "52735",
        "comment": "RETURN TRIP"
    },
    {
        "referenceNumber": 144279,
        "serviceType": "Airport Pickup",
        "name": "Sarah Lynn",
        "email": "s.lynn8219@gmail.com",
        "phone": "+64211490149",
        "pickupAddress": "Auckland International Airport (AKL), Ray Emery Drive, Māngere, Auckland, New Zealand",
        "dropoffAddress": "23 Totara Views Drive, Red Beach, New Zealand",
        "pickupAddresses": [],
        "date": "2026-01-28",
        "time": "18:30",
        "passengers": "8",
        "totalPrice": 191.32,
        "distance": 58.2,
        "duration": "00:48",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "NZ945",
        "arrivalTime": "6:10pm",
        "driverName": "Craig Canty",
        "bookReturn": False,
        "linkedBooking": "14427",
        "comment": "RETURN TRIP"
    },
    # ADDITIONAL BOOKING
    {
        "referenceNumber": 61,
        "serviceType": "Airport Drop-off",
        "name": "Tamer Abdellatif",
        "email": "TAMERMAHER_ICT@YAHOO.COM",
        "phone": "+64211876654",
        "pickupAddress": "39 Chivalry Road, Glenfield, Auckland 0629",
        "dropoffAddress": "Ray Emery Drive, Māngere, Auckland 2022",
        "pickupAddresses": [],
        "date": "2025-12-18",
        "time": "06:15",
        "passengers": "1",
        "totalPrice": 95.00,
        "distance": 35,
        "duration": "00:35",
        "departureFlightNumber": "",
        "departureTime": "",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "driverName": "",
        "bookReturn": False,
        "comment": ""
    },
]


def _build_doc(booking: dict) -> dict:
    ref = str(booking["referenceNumber"])
    doc = {
        "id": str(uuid4()),
        "referenceNumber": booking["referenceNumber"],
        "serviceType": booking["serviceType"],
        "name": booking["name"],
        "email": booking["email"],
        "phone": booking["phone"],
        "pickupAddress": booking["pickupAddress"],
        "dropoffAddress": booking["dropoffAddress"],
        "pickupAddresses": booking.get("pickupAddresses", []),
        "additionalPickups": booking.get("pickupAddresses", []),
        "date": booking["date"],
        "time": booking["time"],
        "passengers": booking["passengers"],
        "luggage": "Standard",
        "totalPrice": booking["totalPrice"],
        "pricing": {"totalPrice": booking["totalPrice"], "distance": booking.get("distance", 0)},
        "distance": booking.get("distance", 0),
        "duration": booking.get("duration", ""),
        "flightNumber": booking.get("arrivalFlightNumber") or booking.get("departureFlightNumber", ""),
        "flightTime": booking.get("arrivalTime") or booking.get("departureTime", ""),
        "departureFlightNumber": booking.get("departureFlightNumber", ""),
        "departureTime": booking.get("departureTime", ""),
        "arrivalFlightNumber": booking.get("arrivalFlightNumber", ""),
        "arrivalTime": booking.get("arrivalTime", ""),
        "paymentMethod": "stripe",
        "paymentStatus": "paid",
        "payment_status": "paid",
        "status": "confirmed",
        "driverName": booking.get("driverName", ""),
        "bookReturn": booking.get("bookReturn", False),
        "returnDate": booking.get("returnDate", ""),
        "returnTime": booking.get("returnTime", ""),
        "specialRequirements": booking.get("comment", ""),
        "comment": booking.get("comment", ""),
        "notes": booking.get("comment", ""),
        "createdAt": datetime.utcnow().isoformat(),
        "importedFrom": "external_system",
        "confirmationSent": True,
        "adminNotified": True,
        "notificationsSent": False,
    }
    if booking.get("linkedBooking"):
        doc["linkedBooking"] = booking["linkedBooking"]
    return doc


async def import_bookings():
    print(f"Connecting to PostgreSQL (Neon)...")
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)

    # Ensure bookings table exists (matches NeonDatabase schema)
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                _id BIGSERIAL PRIMARY KEY,
                id TEXT UNIQUE,
                data JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

    print(f"Importing {len(BOOKINGS)} bookings...")
    print("-" * 50)

    imported = 0
    skipped = 0

    for booking in BOOKINGS:
        ref = booking["referenceNumber"]
        doc = _build_doc(booking)
        data_json = json.dumps(doc, default=_json_serial)

        if DRY_RUN:
            print(f"[DRY RUN] Would import #{ref} {booking['name']} ({booking['date']} {booking['time']})")
            imported += 1
            continue

        async with pool.acquire() as conn:
            # Check if a booking with this referenceNumber already exists
            existing = await conn.fetchrow(
                "SELECT id FROM bookings WHERE data->>'referenceNumber' = $1",
                str(ref)
            )
            if existing:
                print(f"⏭️  Skip #{ref} {booking['name']} - already exists")
                skipped += 1
                continue

            try:
                await conn.execute(
                    """INSERT INTO bookings (id, data)
                       VALUES ($1, $2::jsonb)
                       ON CONFLICT (id) DO NOTHING""",
                    doc["id"], data_json
                )
                print(f"✅ #{ref} {booking['name']} ({booking['date']} {booking['time']})")
                imported += 1
            except Exception as e:
                print(f"❌ #{ref} {booking['name']} - ERROR: {e}")

    await pool.close()

    print("-" * 50)
    if DRY_RUN:
        print(f"[DRY RUN] Would import: {imported}")
    else:
        print(f"✅ Imported: {imported}")
        print(f"⏭️  Skipped:  {skipped}")
        print(f"📊 Total:    {imported + skipped}")


if __name__ == "__main__":
    asyncio.run(import_bookings())
