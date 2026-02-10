import os
try:
    _p = os.path.join(os.path.dirname(__file__), "RENDER_BUILD_STAMP.txt")
    if os.path.exists(_p):
        with open(_p, "r", encoding="utf-8", errors="replace") as f:
            print("BUILD_STAMP:", f.read().strip().replace("\n"," | "))
    else:
        print("BUILD_STAMP: MISSING RENDER_BUILD_STAMP.txt")
except Exception as _e:
    print("BUILD_STAMP_ERROR:", repr(_e))
import os
try:
    _p = os.path.join(os.path.dirname(__file__), "backend", "_build_stamp.txt")
    if os.path.exists(_p):
        with open(_p, "r", encoding="utf-8", errors="replace") as f:
            print("BUILD_STAMP:", f.read().strip().replace("\n"," | "))
    else:
        print("BUILD_STAMP: MISSING backend/_build_stamp.txt")
except Exception as _e:
    print("BUILD_STAMP_ERROR:", repr(_e))
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