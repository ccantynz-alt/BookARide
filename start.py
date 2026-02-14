# AUTO-GENERATED: Render-safe start script
# UTC: 2026-02-11T11:49:29Z
import os
import sys
import re


DB_CASE_CONFLICT_RE = re.compile(r"already have:\s*\[([^\]]+)\]\s*trying to create:?\s*\[[^\]]+\]")


def _extract_existing_db_name(error: Exception):
    match = DB_CASE_CONFLICT_RE.search(str(error))
    if match:
        return match.group(1)
    return None


def _normalize_db_name_case_for_startup():
    """Resolve DB_NAME casing before importing backend app."""
    mongo_url = os.environ.get("MONGO_URL")
    configured_name = os.environ.get("DB_NAME")
    if not mongo_url or not configured_name:
        return

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
                print(
                    f"BOOT: DB_NAME recovered from error as '{existing_name}'",
                    flush=True,
                )
    except Exception as exc:
        print(f"BOOT: DB_NAME normalization skipped due error: {exc}", flush=True)
    finally:
        if sync_client is not None:
            sync_client.close()

def main():
    port = int(os.environ.get("PORT", "10000"))
    host = "0.0.0.0"
    _normalize_db_name_case_for_startup()
    # Prefer "app" if server.py exposes it; fall back to "app" anyway.
    target = "backend.server:app"
    # Some layouts might be "server:app" if PYTHONPATH includes backend; try that if import fails.
    try:
        import backend.server  # noqa: F401
        target = "backend.server:app"
    except Exception:
        target = "server:app"

    import uvicorn
    print(f"BOOT: starting uvicorn target={target} host={host} port={port}", flush=True)
    uvicorn.run(
        target,
        host=host,
        port=port,
        log_level=os.environ.get("LOG_LEVEL", "info"),
        proxy_headers=True,
        forwarded_allow_ips="*",
    )

if __name__ == "__main__":
    main()