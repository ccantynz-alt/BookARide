"""
Render entrypoint wrapper.

Supports Render Start Command:
  uvicorn server:app --host 0.0.0.0 --port $PORT

This wrapper imports the FastAPI app from backend/server.py.
If your real app lives elsewhere, change the import below.
"""

import os
import re

DB_CASE_CONFLICT_RE = re.compile(r"already have:\s*\[([^\]]+)\]\s*trying to create:?\s*\[[^\]]+\]")
KNOWN_DB_NAME_CASE_MAP = {
    "bookaride_db": "Bookaride_db",
}


def _extract_existing_db_name(error: Exception):
    match = DB_CASE_CONFLICT_RE.search(str(error))
    if match:
        return match.group(1)
    return None


def _normalize_db_name_case_for_startup():
    mongo_url = os.environ.get("MONGO_URL")
    configured_name = os.environ.get("DB_NAME")
    if not mongo_url or not configured_name:
        return
    original_name = configured_name
    canonical_name = KNOWN_DB_NAME_CASE_MAP.get(configured_name.lower(), configured_name)
    if canonical_name != configured_name:
        os.environ["DB_NAME"] = canonical_name
        configured_name = canonical_name
        print(
            f"BOOT: DB_NAME normalized from '{original_name}' to '{canonical_name}'",
            flush=True,
        )

    sync_client = None
    try:
        from pymongo import MongoClient
        sync_client = MongoClient(mongo_url, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)

        try:
            for existing_name in sync_client.list_database_names():
                if existing_name.lower() == configured_name.lower():
                    if existing_name != configured_name:
                        os.environ["DB_NAME"] = existing_name
                        print(
                            f"BOOT: DB_NAME case corrected from '{configured_name}' to '{existing_name}'",
                            flush=True,
                        )
                    return
        except Exception:
            pass

        try:
            probe_coll = sync_client[configured_name]["__startup_db_case_probe__"]
            probe_coll.update_one({"_id": "probe"}, {"$set": {"ok": True}}, upsert=True)
            probe_coll.delete_one({"_id": "probe"})
        except Exception as exc:
            existing_name = _extract_existing_db_name(exc)
            if existing_name and existing_name != configured_name:
                os.environ["DB_NAME"] = existing_name
                print(f"BOOT: DB_NAME recovered from error as '{existing_name}'", flush=True)
    except Exception as exc:
        print(f"BOOT: DB_NAME normalization skipped due error: {exc}", flush=True)
    finally:
        if sync_client is not None:
            sync_client.close()


_normalize_db_name_case_for_startup()

from backend.server import app  # noqa: F401