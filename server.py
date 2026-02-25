"""
Render entrypoint wrapper.

Supports Render Start Command:
  uvicorn server:app --host 0.0.0.0 --port $PORT

This wrapper imports the FastAPI app from backend/server.py.
If your real app lives elsewhere, change the import below.
"""

from backend.server import app  # noqa: F401