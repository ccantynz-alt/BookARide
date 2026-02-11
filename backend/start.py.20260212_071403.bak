import os
import sys

def _log(msg: str) -> None:
    print(msg, flush=True)

try:
    # Primary app (may fail if server.py has SyntaxError)
    from server import app  # type: ignore  # noqa: F401
    _log("BOOT: using server.py app")
except Exception as e:
    _log("WARN: failed to import server.py app; falling back to minimal_app.py")
    _log("WARN: " + repr(e))
    from minimal_app import app  # type: ignore  # noqa: F401

if __name__ == "__main__":
    # If someone runs this directly, do a tiny sanity print
    _log("BOOT_OK")