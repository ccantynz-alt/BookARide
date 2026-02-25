from fastapi import FastAPI

app = FastAPI(title="BookARide Backend (Minimal Fallback)")

@app.get("/health")
def health():
    return {"ok": True, "service": "backend", "mode": "minimal_fallback"}