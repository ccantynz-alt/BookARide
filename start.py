# AUTO-GENERATED: Render-safe start script
# UTC: 2026-02-11T11:49:29Z
import os
import sys

def main():
    port = int(os.environ.get("PORT", "10000"))
    host = "0.0.0.0"
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