#!/usr/bin/env python3
"""
Backfill Booking Reference Numbers Script
==========================================
This script assigns sequential reference numbers to all existing bookings
that don't have one, sorted by creation date (oldest first).

Usage:
------
1. Set your MongoDB connection string:
   export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"
   export DB_NAME="your_database_name"

2. Run the script:
   python backfill_booking_references.py

Or run with arguments:
   python backfill_booking_references.py --mongo-url "your_connection_string" --db-name "your_db"

Options:
   --dry-run    Preview changes without actually updating the database
   --start-from Set the starting reference number (default: 1)
"""

import asyncio
import argparse
import os
from motor.motor_asyncio import AsyncIOMotorClient


async def backfill_references(mongo_url: str, db_name: str, dry_run: bool = False, start_from: int = 1):
    """
    Backfill sequential reference numbers for all bookings.
    
    Args:
        mongo_url: MongoDB connection string
        db_name: Database name
        dry_run: If True, only preview changes without updating
        start_from: Starting reference number (default: 1)
    """
    print("=" * 60)
    print("Booking Reference Number Backfill Script")
    print("=" * 60)
    print(f"\nConnecting to database: {db_name}")
    print(f"Dry run mode: {'YES (no changes will be made)' if dry_run else 'NO (will update database)'}")
    print(f"Starting reference number: {start_from}")
    print("-" * 60)
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await db.command('ping')
        print("✅ Connected to MongoDB successfully!\n")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {str(e)}")
        return False
    
    try:
        # Get all bookings sorted by created date (oldest first)
        bookings = await db.bookings.find(
            {}, 
            {'_id': 0, 'id': 1, 'name': 1, 'referenceNumber': 1, 'createdAt': 1, 'date': 1, 'email': 1}
        ).sort('createdAt', 1).to_list(1000)
        
        total_bookings = len(bookings)
        print(f"Found {total_bookings} bookings in database\n")
        
        if total_bookings == 0:
            print("No bookings to update.")
            return True
        
        # Show current state
        print("Current booking references:")
        print("-" * 80)
        print(f"{'#':<4} {'Ref':<8} {'Name':<25} {'Email':<30} {'Trip Date':<12}")
        print("-" * 80)
        
        for i, b in enumerate(bookings, 1):
            ref = b.get('referenceNumber', 'None')
            name = (b.get('name', 'Unknown') or 'Unknown')[:24]
            email = (b.get('email', '') or '')[:29]
            trip_date = b.get('date', 'N/A')
            print(f"{i:<4} {str(ref):<8} {name:<25} {email:<30} {trip_date:<12}")
        
        print("-" * 80)
        print(f"\nWill assign reference numbers {start_from} to {start_from + total_bookings - 1}")
        
        if dry_run:
            print("\n🔍 DRY RUN - No changes made. Remove --dry-run to apply changes.")
            return True
        
        # Confirm before proceeding
        print("\n⚠️  This will update all booking reference numbers!")
        confirm = input("Type 'YES' to proceed: ")
        
        if confirm != 'YES':
            print("❌ Cancelled. No changes made.")
            return False
        
        print("\nUpdating bookings...")
        print("-" * 60)
        
        updated_count = 0
        for i, booking in enumerate(bookings):
            new_ref = start_from + i
            booking_id = booking.get('id')
            old_ref = booking.get('referenceNumber', 'None')
            name = (booking.get('name', 'Unknown') or 'Unknown')[:25]
            
            # Update the booking with new reference number
            result = await db.bookings.update_one(
                {'id': booking_id},
                {'$set': {'referenceNumber': new_ref}}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                updated_count += 1
                print(f"✅ #{new_ref:<4} | {name:<25} | Old: {old_ref}")
            else:
                print(f"⚠️  Could not update booking {booking_id}")
        
        # Update the counter to the next available number
        final_ref = start_from + total_bookings - 1
        await db.counters.update_one(
            {'_id': 'booking_reference'},
            {'$set': {'seq': final_ref}},
            upsert=True
        )
        
        print("-" * 60)
        print(f"\n✅ SUCCESS!")
        print(f"   Updated {updated_count} bookings with reference numbers {start_from} to {final_ref}")
        print(f"   Counter set to {final_ref}")
        print(f"   Next new booking will be #{final_ref + 1}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False
        
    finally:
        client.close()


def main():
    parser = argparse.ArgumentParser(
        description='Backfill sequential reference numbers for bookings',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        '--mongo-url',
        default=os.environ.get('MONGO_URL'),
        help='MongoDB connection string (or set MONGO_URL env var)'
    )
    
    parser.add_argument(
        '--db-name',
        default=os.environ.get('DB_NAME'),
        help='Database name (or set DB_NAME env var)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without updating database'
    )
    
    parser.add_argument(
        '--start-from',
        type=int,
        default=1,
        help='Starting reference number (default: 1)'
    )
    
    args = parser.parse_args()
    
    if not args.mongo_url:
        print("❌ Error: MongoDB URL not provided.")
        print("   Set MONGO_URL environment variable or use --mongo-url argument")
        return 1
    
    if not args.db_name:
        print("❌ Error: Database name not provided.")
        print("   Set DB_NAME environment variable or use --db-name argument")
        return 1
    
    success = asyncio.run(backfill_references(
        mongo_url=args.mongo_url,
        db_name=args.db_name,
        dry_run=args.dry_run,
        start_from=args.start_from
    ))
    
    return 0 if success else 1


if __name__ == '__main__':
    exit(main())
