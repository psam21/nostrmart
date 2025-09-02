from fastapi import FastAPI
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.response import envelope
import os

settings = get_settings()
setup_logging(settings.LOG_LEVEL)

app = FastAPI()


@app.get("/api/health")
async def health():
    return envelope(True, {"status": "ok", "build": os.getenv("GIT_SHA", "unknown")})
