import os
import sys

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

def main():
    port = int(os.environ.get("PORT", "8000"))
    target = "server:app"  # forced: Render-safe import target
    print(f"BOOT: uvicorn target={target} host=0.0.0.0 port={port}", flush=True)

    import uvicorn
    uvicorn.run(
        target,
        host="0.0.0.0",
        port=port,
        log_level=os.environ.get("LOG_LEVEL", "info"),
        proxy_headers=True,
        forwarded_allow_ips="*",
    )

if __name__ == "__main__":
    main()