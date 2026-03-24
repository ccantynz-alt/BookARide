import os
import uvicorn

port = int(os.environ.get("PORT", 10000))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
