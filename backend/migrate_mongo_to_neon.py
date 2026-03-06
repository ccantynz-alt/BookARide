#!/usr/bin/env python3
"""
MongoDB → Neon (PostgreSQL) Migration Script for BookARide.

Exports all collections from MongoDB and imports them into Neon PostgreSQL.
Uses the JSONB storage format so every document is preserved exactly as-is.

Usage:
    # Full migration (reads from MongoDB, writes to Neon):
    python migrate_mongo_to_neon.py

    # Export only (dumps MongoDB to JSON files in ./mongo_export/):
    python migrate_mongo_to_neon.py --export-only

    # Import only (reads JSON files from ./mongo_export/, writes to Neon):
    python migrate_mongo_to_neon.py --import-only

    # Dry run (shows what would be migrated):
    python migrate_mongo_to_neon.py --dry-run

Environment variables:
    MONGO_URL       - MongoDB connection string (required for export)
    DB_NAME         - MongoDB database name (default: bookaride)
    DATABASE_URL    - Neon PostgreSQL connection string (required for import)
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

EXPORT_DIR = Path(__file__).parent / "mongo_export"

# All known collections (will also discover any others in the database)
KNOWN_COLLECTIONS = [
    "bookings",
    "shuttle_bookings",
    "shuttle_runs",
    "bookings_archive",
    "deleted_bookings",
    "admin_users",
    "admin_sessions",
    "password_reset_tokens",
    "drivers",
    "driver_applications",
    "driver_locations",
    "vehicles",
    "payment_transactions",
    "afterpay_transactions",
    "tracking_sessions",
    "email_logs",
    "email_templates",
    "abandoned_bookings",
    "customer_notes",
    "counters",
    "cache",
    "pending_approvals",
    "calendar_auth",
    "service_types",
    "pricing_config",
    "status_checks",
    "xero_tokens",
    "hotel_partners",
    "hotel_bookings",
    "airline_partners",
    "seo_pages",
    "seo_health_reports",
    "error_check_reports",
    "system_tasks",
    "return_alerts_sent",
]


def json_serial(obj: Any) -> Any:
    """JSON serializer for MongoDB types."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if hasattr(obj, "__str__"):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


# ── EXPORT FROM MONGODB ─────────────────────────────────────────

async def export_from_mongo(mongo_url: str, db_name: str, dry_run: bool = False):
    """Export all MongoDB collections to JSON files."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
    except ImportError:
        logger.error("motor package not installed. Install with: pip install motor")
        sys.exit(1)

    logger.info(f"Connecting to MongoDB: {db_name}")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
    db = client[db_name]

    # Verify connection
    try:
        await db.command("ping")
        logger.info("MongoDB connection OK")
    except Exception as e:
        logger.error(f"Cannot connect to MongoDB: {e}")
        sys.exit(1)

    # Discover all collections
    collection_names = await db.list_collection_names()
    all_collections = list(set(KNOWN_COLLECTIONS + collection_names))
    all_collections.sort()

    logger.info(f"Found {len(collection_names)} collections in MongoDB")

    if not dry_run:
        EXPORT_DIR.mkdir(exist_ok=True)

    total_docs = 0
    summary = []

    for col_name in all_collections:
        if col_name.startswith("system."):
            continue

        try:
            count = await db[col_name].count_documents({})
        except Exception:
            count = 0

        if count == 0:
            logger.info(f"  {col_name}: empty, skipping")
            continue

        logger.info(f"  {col_name}: {count} documents")
        summary.append((col_name, count))
        total_docs += count

        if dry_run:
            continue

        # Export all documents
        docs = []
        async for doc in db[col_name].find({}):
            # Convert ObjectId and other BSON types
            clean_doc = _clean_bson(doc)
            docs.append(clean_doc)

        # Write to JSON file
        export_file = EXPORT_DIR / f"{col_name}.json"
        with open(export_file, "w", encoding="utf-8") as f:
            json.dump(docs, f, default=json_serial, ensure_ascii=False, indent=2)

        logger.info(f"    → Exported {len(docs)} docs to {export_file.name}")

    client.close()

    logger.info(f"\nExport complete: {total_docs} total documents from {len(summary)} collections")
    if dry_run:
        logger.info("(Dry run — no files written)")

    return summary


def _clean_bson(doc: dict) -> dict:
    """Convert BSON types to JSON-serializable types."""
    cleaned = {}
    for key, value in doc.items():
        if key == "_id":
            # Convert ObjectId to string, store as _mongo_id for reference
            cleaned["_mongo_id"] = str(value)
            # If _id is a string (e.g., counters collection uses _id="booking_reference"),
            # and there's no 'id' field, use the _id value as the id
            if isinstance(value, str) and "id" not in doc:
                cleaned["id"] = value
            continue
        cleaned[key] = _clean_value(value)
    return cleaned


def _clean_value(value: Any) -> Any:
    """Recursively clean BSON values."""
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _clean_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_clean_value(v) for v in value]
    # ObjectId, Binary, etc.
    return str(value)


# ── IMPORT INTO NEON POSTGRESQL ──────────────────────────────────

async def import_to_neon(database_url: str, dry_run: bool = False):
    """Import JSON files into Neon PostgreSQL."""
    try:
        import asyncpg
    except ImportError:
        logger.error("asyncpg package not installed. Install with: pip install asyncpg")
        sys.exit(1)

    # Find JSON files to import
    if not EXPORT_DIR.exists():
        logger.error(f"Export directory not found: {EXPORT_DIR}")
        logger.error("Run with --export-only first, or run without --import-only for full migration")
        sys.exit(1)

    json_files = sorted(EXPORT_DIR.glob("*.json"))
    if not json_files:
        logger.error(f"No JSON files found in {EXPORT_DIR}")
        sys.exit(1)

    logger.info(f"Found {len(json_files)} collection files to import")

    if dry_run:
        for f in json_files:
            with open(f, "r") as fh:
                docs = json.load(fh)
            logger.info(f"  {f.stem}: {len(docs)} documents")
        logger.info("(Dry run — no data written)")
        return

    # Connect to Neon
    logger.info(f"Connecting to Neon PostgreSQL...")
    pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)

    # Run schema.sql first
    schema_file = Path(__file__).parent / "schema.sql"
    if schema_file.exists():
        logger.info("Applying schema.sql...")
        schema_sql = schema_file.read_text()
        async with pool.acquire() as conn:
            await conn.execute(schema_sql)
        logger.info("Schema applied successfully")
    else:
        logger.warning("schema.sql not found — tables will be auto-created")

    total_imported = 0

    for json_file in json_files:
        col_name = json_file.stem

        with open(json_file, "r", encoding="utf-8") as f:
            docs = json.load(f)

        if not docs:
            logger.info(f"  {col_name}: empty, skipping")
            continue

        logger.info(f"  {col_name}: importing {len(docs)} documents...")

        # Ensure table exists
        async with pool.acquire() as conn:
            await conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {col_name} (
                    _id BIGSERIAL PRIMARY KEY,
                    id TEXT UNIQUE,
                    data JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)

        # Import in batches
        batch_size = 100
        imported = 0

        for i in range(0, len(docs), batch_size):
            batch = docs[i:i + batch_size]

            async with pool.acquire() as conn:
                async with conn.transaction():
                    for doc in batch:
                        doc_id = doc.get("id")
                        data_json = json.dumps(doc, default=json_serial, ensure_ascii=False)

                        try:
                            await conn.execute(
                                f"""INSERT INTO {col_name} (id, data)
                                    VALUES ($1, $2::jsonb)
                                    ON CONFLICT (id) DO UPDATE SET data = $2::jsonb""",
                                doc_id, data_json
                            )
                            imported += 1
                        except Exception as e:
                            logger.warning(f"    Error importing doc in {col_name}: {e}")
                            # Try without id constraint
                            try:
                                await conn.execute(
                                    f"""INSERT INTO {col_name} (id, data)
                                        VALUES ($1, $2::jsonb)""",
                                    doc_id or f"auto_{imported}", data_json
                                )
                                imported += 1
                            except Exception as e2:
                                logger.error(f"    Failed to import doc: {e2}")

        logger.info(f"    → Imported {imported}/{len(docs)} documents")
        total_imported += imported

    await pool.close()
    logger.info(f"\nImport complete: {total_imported} total documents imported")


# ── FULL MIGRATION ───────────────────────────────────────────────

async def full_migration(mongo_url: str, db_name: str, database_url: str, dry_run: bool = False):
    """Export from MongoDB and import to Neon in one step."""
    logger.info("=" * 60)
    logger.info("BookARide: MongoDB → Neon PostgreSQL Migration")
    logger.info("=" * 60)

    # Step 1: Export
    logger.info("\n── STEP 1: Export from MongoDB ──")
    await export_from_mongo(mongo_url, db_name, dry_run=dry_run)

    if dry_run:
        logger.info("\n(Dry run complete — no data was exported or imported)")
        return

    # Step 2: Import
    logger.info("\n── STEP 2: Import to Neon PostgreSQL ──")
    await import_to_neon(database_url, dry_run=False)

    logger.info("\n" + "=" * 60)
    logger.info("Migration complete!")
    logger.info("=" * 60)
    logger.info("\nNext steps:")
    logger.info("  1. Update your .env: replace MONGO_URL with DATABASE_URL")
    logger.info("  2. Restart your backend server")
    logger.info("  3. Verify the admin dashboard loads correctly")
    logger.info("  4. Test creating a booking")
    logger.info("  5. Once confirmed working, you can decommission MongoDB")


# ── CLI ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Migrate BookARide from MongoDB to Neon PostgreSQL"
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Only export from MongoDB to JSON files"
    )
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="Only import from JSON files to Neon"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without doing it"
    )
    parser.add_argument(
        "--mongo-url",
        default=os.environ.get("MONGO_URL"),
        help="MongoDB connection string (or set MONGO_URL env var)"
    )
    parser.add_argument(
        "--db-name",
        default=os.environ.get("DB_NAME", "bookaride"),
        help="MongoDB database name (default: bookaride)"
    )
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL"),
        help="Neon PostgreSQL connection string (or set DATABASE_URL env var)"
    )

    args = parser.parse_args()

    if args.export_only:
        if not args.mongo_url:
            logger.error("MONGO_URL is required for export. Set it as an env var or pass --mongo-url")
            sys.exit(1)
        asyncio.run(export_from_mongo(args.mongo_url, args.db_name, args.dry_run))

    elif args.import_only:
        if not args.database_url:
            logger.error("DATABASE_URL is required for import. Set it as an env var or pass --database-url")
            sys.exit(1)
        asyncio.run(import_to_neon(args.database_url, args.dry_run))

    else:
        if not args.mongo_url:
            logger.error("MONGO_URL is required. Set it as an env var or pass --mongo-url")
            sys.exit(1)
        if not args.database_url:
            logger.error("DATABASE_URL is required. Set it as an env var or pass --database-url")
            sys.exit(1)
        asyncio.run(full_migration(args.mongo_url, args.db_name, args.database_url, args.dry_run))


if __name__ == "__main__":
    main()
