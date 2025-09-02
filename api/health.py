from fastapi import FastAPI
from app.core.response import envelope
import os

app = FastAPI()


@app.get("/api/health")
async def health():
    try:
        from app.core.config import get_settings
        from app.core.logging import setup_logging
        
        settings = get_settings()
        setup_logging(settings.LOG_LEVEL)
        
        return envelope(True, {"status": "ok", "build": os.getenv("GIT_SHA", "unknown")})
    except Exception as e:
        return envelope(False, None, {"code": "CONFIG_ERROR", "message": str(e)}, 500)
