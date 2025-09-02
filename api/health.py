from fastapi import FastAPI
import os

app = FastAPI()


@app.get("/api/health")
async def health():
    return {"ok": True, "status": "healthy", "build": os.getenv("GIT_SHA", "unknown")}
