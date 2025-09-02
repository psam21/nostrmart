from fastapi import FastAPI
import os

app = FastAPI()


@app.get("/")
async def health():
    return {"ok": True, "status": "healthy", "build": os.getenv("GIT_SHA", "unknown")}
