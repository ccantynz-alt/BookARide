"""
Seed script: generates 1200+ realistic bookings and inserts them into Neon PostgreSQL.

Run locally (requires internet access to Neon):
    pip install asyncpg
    python seed_bookings.py --database-url "postgresql://..."
"""

import asyncio
import asyncpg
import json
import uuid
import random
import argparse
import logging
from datetime import datetime, timedelta, date

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# ── Realistic NZ data pools ──────────────────────────────────────

NZ_FIRST_NAMES = [
    "James", "Oliver", "William", "Jack", "Noah", "Liam", "Mason", "Lucas",
    "Ethan", "Logan", "Emily", "Charlotte", "Olivia", "Ava", "Sophia",
    "Isabella", "Mia", "Amelia", "Harper", "Evelyn", "Aroha", "Tane",
    "Hemi", "Wiremu", "Rangi", "Mere", "Hinerangi", "Anika", "Jayden",
    "Brooklyn", "Riley", "Taylor", "Jordan", "Morgan", "Alex", "Sam",
    "Daniel", "Matthew", "Joshua", "Ryan", "Ethan", "Ben", "Tom", "George",
    "Harry", "Charlie", "Finn", "Leo", "Max", "Hugo", "Oscar", "Archie",
    "Luca", "Sebastian", "Henry", "Theodore", "Nathaniel", "Elijah", "Owen",
    "Amos", "Grace", "Lily", "Zoe", "Hannah", "Ruby", "Isla", "Chloe",
    "Sophie", "Lucy", "Ella", "Mila", "Aurora", "Violet", "Nora", "Stella",
    "Penelope", "Claire", "Audrey", "Savannah", "Eleanor", "Addison", "Nina",
]

NZ_LAST_NAMES = [
    "Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson",
    "White", "Martin", "Anderson", "Thompson", "Davis", "Robinson", "Clark",
    "Walker", "Mitchell", "Hall", "Allen", "Scott", "Young", "King", "Wright",
    "Turner", "Harris", "Green", "Baker", "Lewis", "Parker", "Hill", "Morris",
    "Parata", "Tane", "Hemi", "Ngata", "Te Ao", "Waititi", "Tuhoe", "Parekura",
    "Murphy", "Kelly", "O'Brien", "Walsh", "McCarthy", "Doyle", "Byrne",
    "Sullivan", "Ryan", "Brennan", "Gallagher", "O'Connor", "Nguyen", "Patel",
    "Singh", "Kim", "Chen", "Wang", "Li", "Zhang", "Liu", "Park", "Lee",
    "Kumar", "Sharma", "Gupta", "Mehta", "Kapoor", "Verma", "Rao", "Malhotra",
]

CHRISTCHURCH_ADDRESSES = [
    "Christchurch Airport, 30 Durey Road, Harewood",
    "Cathedral Square, Christchurch Central City",
    "Hagley Park, Riccarton Avenue, Riccarton",
    "Addington Raceway, 75 Jack Hinton Drive, Addington",
    "Westfield Riccarton, 129 Riccarton Road, Riccarton",
    "University of Canterbury, Ilam Road, Ilam",
    "Countdown Moorhouse, 505 Moorhouse Avenue, Sydenham",
    "Christchurch Hospital, 2 Riccarton Avenue, Christchurch",
    "Hillmorton Hospital, 329 Annex Road, Hillmorton",
    "Merivale Mall, 189 Papanui Road, Merivale",
    "The Palms Shopping Centre, 191 Marshland Road, Shirley",
    "Northlands Mall, 55 Main North Road, Papanui",
    "Pak'nSave Moorhouse, 129 Moorhouse Avenue, Christchurch",
    "Convention Centre, 95 Kilmore Street, Christchurch",
    "Town Hall, 86 Kilmore Street, Christchurch",
    "Countdown Fendalton, 6 Clyde Road, Fendalton",
    "Fitzgerald Ave, Christchurch",
    "Burnside High School, 1 McDougall Avenue, Burnside",
    "Cashmere High School, 2 Barrington Street, Cashmere",
    "St Andrew's College, 347 Papanui Road, Papanui",
    "Linwood Avenue, Linwood",
    "New Brighton Mall, 82 Seaham Street, New Brighton",
    "Sumner Village, The Esplanade, Sumner",
    "Lyttelton Harbour, Lyttelton",
    "Little River, Banks Peninsula",
    "Akaroa, Banks Peninsula",
    "Rolleston, Selwyn District",
    "Lincoln, Canterbury",
    "Rangiora, Waimakariri District",
    "Kaiapoi, Waimakariri District",
    "Pegasus, North Canterbury",
    "Amberley, Hurunui District",
    "Hanmer Springs, Hurunui District",
    "Hokitika, West Coast",
    "Greymouth, West Coast",
    "Arthur's Pass, Canterbury",
    "Lake Tekapo, Mackenzie District",
    "Timaru, South Canterbury",
    "Ashburton, Mid Canterbury",
    "Methven, Mount Hutt",
    "Darfield, Canterbury",
    "West Melton, Canterbury",
    "Prebbleton, Selwyn",
    "Halswell, Canterbury",
    "Wigram, Canterbury",
    "Hornby, Canterbury",
    "Sockburn, Canterbury",
    "Upper Riccarton, Canterbury",
    "Bishopdale, Canterbury",
    "Mairehau, Canterbury",
    "Parklands, Canterbury",
    "Avonhead, Canterbury",
    "Russley, Canterbury",
    "Yaldhurst, Canterbury",
    "Templeton, Canterbury",
    "Tai Tapu, Canterbury",
    "Motukarara, Canterbury",
    "Leeston, Selwyn",
    "Ellesmere, Canterbury",
    "Springfield, Canterbury",
    "Sheffield, Canterbury",
]

AIRLINES = [
    "Air New Zealand", "Jetstar", "Qantas", "Virgin Australia",
    "Singapore Airlines", "Emirates", "Cathay Pacific", "Fiji Airways",
]
FLIGHT_PREFIXES = ["NZ", "JQ", "QF", "VA", "SQ", "EK", "CX", "FJ"]

SERVICE_TYPES = [
    ("airport_shuttle", 0.35),
    ("point_to_point", 0.35),
    ("hourly_charter", 0.15),
    ("corporate_transfer", 0.15),
]

STATUSES = [
    ("completed", 0.55),
    ("confirmed", 0.20),
    ("pending", 0.10),
    ("cancelled", 0.10),
    ("pending_approval", 0.05),
]

PAYMENT_STATUSES = {
    "completed": [("paid", 0.95), ("refunded", 0.05)],
    "confirmed": [("paid", 0.70), ("unpaid", 0.30)],
    "pending": [("unpaid", 0.85), ("paid", 0.15)],
    "cancelled": [("refunded", 0.60), ("paid", 0.25), ("unpaid", 0.15)],
    "pending_approval": [("unpaid", 1.0)],
}

NOTES_POOL = [
    "", "", "", "",  # most bookings have no notes
    "Please call on arrival.",
    "Flight may be delayed, will confirm closer to date.",
    "Travelling with an infant seat required.",
    "Please have water available in the vehicle.",
    "Corporate account – invoice to Acme Ltd.",
    "Two large suitcases + ski equipment.",
    "Wheelchair accessible vehicle required.",
    "Meet & greet at arrivals with name sign please.",
    "Connecting flight – please allow extra time.",
    "VIP client – please ensure punctuality.",
    "3 large bags and a golf bag.",
    "Early morning pickup, driver please be quiet.",
    "Return booking – same driver preferred.",
    "Pet friendly vehicle required (small dog).",
    "Prefer SUV if available.",
    "Has mobility issues, extra assistance appreciated.",
]

PAYMENT_METHODS = ["card", "card", "card", "cash", "invoice"]
NOTIFICATION_PREFS = ["email", "sms", "both", "both", "both"]


def weighted_choice(choices):
    """Pick an item from [(value, weight), ...] list."""
    total = sum(w for _, w in choices)
    r = random.uniform(0, total)
    upto = 0
    for val, weight in choices:
        if upto + weight >= r:
            return val
        upto += weight
    return choices[-1][0]


def random_flight_number():
    prefix = random.choice(FLIGHT_PREFIXES)
    return f"{prefix}{random.randint(100, 999)}"


def random_time():
    hour = random.randint(4, 23)
    minute = random.choice([0, 15, 30, 45])
    return f"{hour:02d}:{minute:02d}"


def random_nz_phone():
    prefix = random.choice(["021", "022", "027", "028", "029", "03"])
    if prefix == "03":
        return f"03 {random.randint(300, 999)} {random.randint(1000, 9999)}"
    return f"{prefix} {random.randint(100, 999)} {random.randint(1000, 9999)}"


def random_email(first, last):
    domains = ["gmail.com", "outlook.com", "yahoo.com", "xtra.co.nz", "hotmail.com",
               "icloud.com", "me.com", "protonmail.com", "vodafone.co.nz"]
    sep = random.choice([".", "_", ""])
    suffix = random.choice(["", str(random.randint(1, 99))])
    return f"{first.lower()}{sep}{last.lower()}{suffix}@{random.choice(domains)}"


def generate_pricing(service_type):
    if service_type == "airport_shuttle":
        distance = round(random.uniform(10, 55), 1)
        base = random.choice([45, 55, 65, 75])
        per_km = random.choice([2.5, 3.0, 3.5])
    elif service_type == "hourly_charter":
        distance = round(random.uniform(20, 120), 1)
        base = random.choice([80, 100, 120])
        per_km = 0
        hours = random.randint(2, 8)
        total = round(base * hours, 2)
        return {
            "amount": total,
            "currency": "NZD",
            "distance": distance,
            "duration": hours * 60,
            "basePrice": base,
            "perKmRate": per_km,
            "hours": hours,
            "breakdown": f"${base}/hr × {hours}hrs",
        }
    elif service_type == "corporate_transfer":
        distance = round(random.uniform(5, 40), 1)
        base = random.choice([60, 80, 100])
        per_km = 2.0
    else:  # point_to_point
        distance = round(random.uniform(3, 80), 1)
        base = random.choice([35, 45, 55])
        per_km = random.choice([2.0, 2.5, 3.0])

    total = round(base + distance * per_km, 2)
    return {
        "amount": total,
        "currency": "NZD",
        "distance": distance,
        "duration": int(distance * 1.8),
        "basePrice": base,
        "perKmRate": per_km,
        "breakdown": f"${base} base + {distance}km × ${per_km}/km",
    }


def generate_booking(ref_num: int, booking_date: date) -> dict:
    first = random.choice(NZ_FIRST_NAMES)
    last = random.choice(NZ_LAST_NAMES)

    service_type = weighted_choice(SERVICE_TYPES)
    status = weighted_choice(STATUSES)
    payment_status = weighted_choice(PAYMENT_STATUSES[status])

    pickup = random.choice(CHRISTCHURCH_ADDRESSES)
    dropoff = random.choice([a for a in CHRISTCHURCH_ADDRESSES if a != pickup])

    is_airport = service_type == "airport_shuttle"
    flight_number = random_flight_number() if is_airport else ""
    arrival_time = random_time() if is_airport and random.random() > 0.5 else ""

    book_return = is_airport and random.random() > 0.65
    return_date = ""
    return_time = ""
    return_flight = ""
    if book_return:
        rdate = booking_date + timedelta(days=random.randint(3, 21))
        return_date = rdate.strftime("%Y-%m-%d")
        return_time = random_time()
        return_flight = random_flight_number()

    created_at = datetime.combine(
        booking_date - timedelta(days=random.randint(0, 14)),
        datetime.strptime(random_time(), "%H:%M").time(),
    )

    pricing = generate_pricing(service_type)

    return {
        "id": str(uuid.uuid4()),
        "referenceNumber": str(ref_num),
        "serviceType": service_type,
        "pickupAddress": pickup,
        "pickupAddresses": [pickup],
        "dropoffAddress": dropoff,
        "date": booking_date.strftime("%Y-%m-%d"),
        "time": random_time(),
        "passengers": str(random.randint(1, 8)),
        "name": f"{first} {last}",
        "email": random_email(first, last),
        "phone": random_nz_phone(),
        "notes": random.choice(NOTES_POOL),
        "pricing": pricing,
        "status": status,
        "payment_status": payment_status,
        "paymentMethod": random.choice(PAYMENT_METHODS),
        "notificationPreference": random.choice(NOTIFICATION_PREFS),
        "language": random.choice(["en", "en", "en", "zh", "mi", "hi"]),
        "departureFlightNumber": flight_number if is_airport and "airport" in pickup.lower() else "",
        "arrivalFlightNumber": flight_number if is_airport and "airport" not in pickup.lower() else "",
        "arrivalTime": arrival_time,
        "departureTime": random_time() if flight_number and not arrival_time else "",
        "flightNumber": flight_number,
        "bookReturn": book_return,
        "returnDate": return_date,
        "returnTime": return_time,
        "returnFlightNumber": return_flight,
        "returnDepartureFlightNumber": return_flight,
        "vipAirportPickup": is_airport and random.random() > 0.85,
        "oversizedLuggage": random.random() > 0.90,
        "selectedAddOns": [],
        "skipNotifications": False,
        "createdAt": created_at.isoformat(),
        "importedFrom": "seed_script",
    }


async def seed(database_url: str, count: int, start_ref: int):
    logger.info(f"Connecting to Neon…")
    pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)

    # Ensure table exists
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                _id BIGSERIAL PRIMARY KEY,
                id TEXT UNIQUE,
                data JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        # Also ensure the booking_reference counter exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS counters (
                _id BIGSERIAL PRIMARY KEY,
                id TEXT UNIQUE,
                data JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        current_max = await conn.fetchval(
            "SELECT MAX((data->>'value')::int) FROM counters WHERE id = 'booking_reference'"
        )
        new_ref_start = max(start_ref, (current_max or 0) + 1)
        logger.info(f"Starting reference numbers from: {new_ref_start}")

    # Generate bookings spread over the past 2 years
    today = date.today()
    start_date = today - timedelta(days=730)

    bookings = []
    for i in range(count):
        days_ago = random.randint(0, 730)
        booking_date = today - timedelta(days=days_ago)
        ref = new_ref_start + i
        bookings.append(generate_booking(ref, booking_date))

    # Sort by createdAt so referenceNumbers are roughly chronological
    bookings.sort(key=lambda b: b["createdAt"])

    # Insert in batches of 100
    inserted = 0
    skipped = 0
    batch_size = 100

    for i in range(0, len(bookings), batch_size):
        batch = bookings[i : i + batch_size]
        async with pool.acquire() as conn:
            async with conn.transaction():
                for b in batch:
                    try:
                        await conn.execute(
                            """INSERT INTO bookings (id, data)
                               VALUES ($1, $2::jsonb)
                               ON CONFLICT (id) DO NOTHING""",
                            b["id"],
                            json.dumps(b),
                        )
                        inserted += 1
                    except Exception as e:
                        logger.warning(f"  Skip {b['id']}: {e}")
                        skipped += 1

        pct = int((i + len(batch)) / count * 100)
        logger.info(f"  [{pct:3d}%] {inserted} inserted, {skipped} skipped")

    # Update booking_reference counter to the new max
    final_ref = new_ref_start + count - 1
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO counters (id, data)
               VALUES ('booking_reference', $1::jsonb)
               ON CONFLICT (id) DO UPDATE SET data = $1::jsonb""",
            json.dumps({"id": "booking_reference", "value": final_ref}),
        )

    await pool.close()
    logger.info(f"\nDone! Inserted {inserted} bookings (skipped {skipped}).")
    logger.info(f"Reference numbers used: {new_ref_start} – {final_ref}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed BookARide bookings into Neon PostgreSQL")
    parser.add_argument(
        "--database-url",
        default="postgresql://neondb_owner:npg_coP0gWvAdS2N@ep-jolly-queen-aihsx1yx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        help="Neon PostgreSQL connection string",
    )
    parser.add_argument("--count", type=int, default=1200, help="Number of bookings to generate")
    parser.add_argument("--start-ref", type=int, default=10, help="Starting reference number")
    args = parser.parse_args()

    asyncio.run(seed(args.database_url, args.count, args.start_ref))
