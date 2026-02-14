import os
import sys
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
    """Resolve DB_NAME casing before app import to avoid startup crashes."""
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

        # Preferred path: list DBs and match case-insensitively.
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
            # Some users do not have listDatabases privilege.
            pass

        # Fallback path: run a tiny probe write to trigger Mongo case-conflict details.
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

def _pick_app_target():
    # Prefer backend/server.py if it exists
    here = os.path.dirname(__file__)
    backend_server = os.path.join(here, "server.py")
    root_server = os.path.join(os.path.dirname(here), "server.py")

    # Render runs: python backend/start.py (cwd is repo root)
    # If backend/server.py exists, use server:app
    if os.path.exists(backend_server):
        return "server:app"

    # Otherwise, if root server.py exists, use server:app
    if os.path.exists(root_server):
        return "server:app"

    # Fallback (will error clearly)
    return "server:app"


def _ensure_probe_routes(app):
    """Ensure Render/K8s probe routes always exist on runtime app."""
    existing_paths = {
        getattr(route, "path", "")
        for route in getattr(app, "routes", [])
        if getattr(route, "path", None)
    }

    probe_payload = {"status": "healthy", "service": "bookaride-api"}

    if "/" not in existing_paths:
        @app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
        async def _probe_root():
            return probe_payload

    if "/health" not in existing_paths:
        @app.api_route("/health", methods=["GET", "HEAD"], include_in_schema=False)
        async def _probe_health():
            return probe_payload

    if "/healthz" not in existing_paths:
        @app.api_route("/healthz", methods=["GET", "HEAD"], include_in_schema=False)
        async def _probe_healthz():
            return probe_payload

    if "/api/health" not in existing_paths:
        @app.api_route("/api/health", methods=["GET", "HEAD"], include_in_schema=False)
        async def _probe_api_health():
            return probe_payload


def main():
    port = int(os.environ.get("PORT", "8000"))
    target = "server:app"  # forced: Render-safe import target
    _normalize_db_name_case_for_startup()
    print(f"BOOT: uvicorn target={target} host=0.0.0.0 port={port}", flush=True)

    # Import the app object directly so we can enforce probe routes before serving.
    if os.path.exists(os.path.join(os.path.dirname(__file__), "server.py")):
        from server import app as runtime_app  # type: ignore
    else:
        from backend.server import app as runtime_app  # type: ignore

    _ensure_probe_routes(runtime_app)

    import uvicorn
    uvicorn.run(
        runtime_app,
        host="0.0.0.0",
        port=port,
        log_level=os.environ.get("LOG_LEVEL", "info"),
        proxy_headers=True,
        forwarded_allow_ips="*",
    )

if __name__ == "__main__":
    main()