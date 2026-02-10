import os
import uvicorn

# Import the FastAPI app.
# This should match your working entrypoint.
# If you use the root-level server.py wrapper, this works.
from server import app  # noqa: F401

def main() -> None:
    port_str = os.environ.get("PORT", "10000")
    try:
        port = int(port_str)
    except Exception:
        port = 10000

    # Bind immediately; avoid any shell-expansion issues.
    uvicorn.run("server:app", host="0.0.0.0", port=port, log_level="info")

if __name__ == "__main__":
    main()