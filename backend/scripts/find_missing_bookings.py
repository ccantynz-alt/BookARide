#!/usr/bin/env python3
"""
Find Missing Bookings — Diagnostic Script
==========================================

Searches ALL booking-related tables in the database for bookings that:
1. Exist in the DB but fail Pydantic validation (silently dropped from admin panel)
2. Are stuck in abandoned_bookings, pending_approvals, deleted_bookings, or bookings_archive
3. Match a specific name or date search

Usage:
    # Search all tables for any booking matching "Joanne" or "Tracey"
    DATABASE_URL="your_neon_url" python3 find_missing_bookings.py --search "Joanne" --search "Tracey"

    # Search for bookings on a specific date
    DATABASE_URL="your_neon_url" python3 find_missing_bookings.py --date 2026-03-19

    # Find ALL bookings that would be hidden from admin panel (validation failures)
    DATABASE_URL="your_neon_url" python3 find_missing_bookings.py --find-broken

    # Show everything — all tables, all bookings
    DATABASE_URL="your_neon_url" python3 find_missing_bookings.py --all
"""

import asyncio
import asyncpg
import json
import os
import sys
import argparse
from datetime import datetime


TABLES_TO_SEARCH = [
    "bookings",
    "shuttle_bookings",
    "abandoned_bookings",
    "pending_approvals",
    "deleted_bookings",
    "bookings_archive",
]

# Required fields for a booking to pass Pydantic validation in the admin panel
REQUIRED_FIELDS = [
    "serviceType", "pickupAddress", "dropoffAddress", "date", "time",
    "passengers", "name", "email", "phone", "pricing"
]


def print_booking(booking_data, table_name):
    """Print a booking in a readable format."""
    d = booking_data if isinstance(booking_data, dict) else {}
    ref = d.get("referenceNumber", "N/A")
    name = d.get("name", "N/A")
    email = d.get("email", "N/A")
    phone = d.get("phone", "N/A")
    date = d.get("date", "N/A")
    time = d.get("time", "N/A")
    status = d.get("status", "N/A")
    service = d.get("serviceType", "N/A")
    pickup = d.get("pickupAddress", "N/A")
    dropoff = d.get("dropoffAddress", "N/A")
    booking_id = d.get("id", "N/A")
    created = d.get("createdAt", "N/A")
    payment = d.get("payment_status", "N/A")

    # Check which required fields are missing
    missing = [f for f in REQUIRED_FIELDS if not d.get(f)]

    print(f"  ┌─ [{table_name}] Ref #{ref}")
    print(f"  │  Name:    {name}")
    print(f"  │  Email:   {email}")
    print(f"  │  Phone:   {phone}")
    print(f"  │  Date:    {date} at {time}")
    print(f"  │  Status:  {status}  |  Payment: {payment}")
    print(f"  │  Service: {service}")
    print(f"  │  Pickup:  {pickup}")
    print(f"  │  Dropoff: {dropoff}")
    print(f"  │  ID:      {booking_id}")
    print(f"  │  Created: {created}")
    if missing:
        print(f"  │  ⚠ MISSING FIELDS (will be hidden from admin): {', '.join(missing)}")
    print(f"  └──────────────────────────────────")


async def search_table(conn, table_name, search_terms=None, date_filter=None, find_broken=False, show_all=False):
    """Search a single table for matching bookings."""
    # Check if table exists
    exists = await conn.fetchval(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
        table_name
    )
    if not exists:
        return []

    results = []

    if show_all:
        rows = await conn.fetch(f"SELECT id, data, created_at FROM {table_name} ORDER BY created_at DESC")
        for row in rows:
            data = row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
            results.append((table_name, data, row["created_at"]))
        return results

    if search_terms:
        for term in search_terms:
            term_lower = term.lower()
            # Search in JSONB data for name, email, phone fields (case-insensitive)
            rows = await conn.fetch(
                f"""SELECT id, data, created_at FROM {table_name}
                    WHERE LOWER(data->>'name') LIKE $1
                       OR LOWER(data->>'email') LIKE $1
                       OR LOWER(data->>'phone') LIKE $1
                       OR LOWER(data->>'referenceNumber') LIKE $1
                    ORDER BY created_at DESC""",
                f"%{term_lower}%"
            )
            for row in rows:
                data = row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
                results.append((table_name, data, row["created_at"]))

    if date_filter:
        rows = await conn.fetch(
            f"""SELECT id, data, created_at FROM {table_name}
                WHERE data->>'date' = $1
                   OR data->>'returnDate' = $1
                ORDER BY created_at DESC""",
            date_filter
        )
        for row in rows:
            data = row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
            results.append((table_name, data, row["created_at"]))

    if find_broken:
        # Find bookings missing required fields (these are hidden from admin panel)
        rows = await conn.fetch(
            f"SELECT id, data, created_at FROM {table_name} ORDER BY created_at DESC"
        )
        for row in rows:
            data = row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
            missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
            if missing:
                results.append((table_name, data, row["created_at"]))

    # Deduplicate by booking id
    seen = set()
    unique = []
    for table, data, created in results:
        bid = data.get("id", str(created))
        if bid not in seen:
            seen.add(bid)
            unique.append((table, data, created))
    return unique


async def main():
    parser = argparse.ArgumentParser(description="Find missing bookings in BookARide database")
    parser.add_argument("--search", action="append", help="Search term (name, email, phone, ref). Can be used multiple times.")
    parser.add_argument("--date", help="Search for bookings on this date (YYYY-MM-DD format)")
    parser.add_argument("--find-broken", action="store_true", help="Find bookings that fail validation (hidden from admin)")
    parser.add_argument("--all", action="store_true", help="Show ALL bookings across all tables")
    args = parser.parse_args()

    if not args.search and not args.date and not args.find_broken and not args.all:
        parser.print_help()
        print("\nExample: python3 find_missing_bookings.py --search Joanne --search Tracey --date 2026-03-19")
        sys.exit(1)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("Set it to your Neon PostgreSQL connection string.")
        sys.exit(1)

    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    try:
        total_found = 0

        for table in TABLES_TO_SEARCH:
            results = await search_table(
                conn, table,
                search_terms=args.search,
                date_filter=args.date,
                find_broken=args.find_broken,
                show_all=args.all
            )

            if results:
                print(f"\n{'='*60}")
                print(f"  TABLE: {table} — {len(results)} booking(s) found")
                print(f"{'='*60}")
                for table_name, data, created_at in results:
                    print_booking(data, table_name)
                total_found += len(results)

        # Summary
        print(f"\n{'='*60}")
        if total_found == 0:
            print("  No bookings found matching your search.")
            print("  Possible reasons:")
            print("    - The booking was never submitted (customer abandoned before completing)")
            print("    - The booking was made under a different name/email")
            print("    - The booking is in a table not checked by this script")
        else:
            print(f"  TOTAL: {total_found} booking(s) found across all tables")
            if args.find_broken:
                print(f"\n  Bookings with missing fields are HIDDEN from the admin panel.")
                print(f"  To fix: update them in the database to add the missing fields,")
                print(f"  or use the PATCH /api/bookings/{{id}} endpoint.")
        print(f"{'='*60}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
