import os
import uvicorn

# Import the FastAPI app from backend/server.py
from server import app  # noqa: F401

def main() -> None:
    port_str = os.environ.get("PORT", "10000")
    try:
        port = int(port_str)
    except Exception:
        port = 10000

    uvicorn.run("server:app", host="0.0.0.0", port=port, log_level="info")

if __name__ == "__main__":
    main()