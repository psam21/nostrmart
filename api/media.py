from fastapi import FastAPI, HTTPException, UploadFile, File
from app.core.config import get_settings
from app.core.logging import setup_logging, new_request_id
from app.core.response import envelope
from app.services.media_service import MediaService
from app.adapters.supabase_client import SupabaseClient
import logging

settings = get_settings()
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI()
supabase = SupabaseClient(settings)
media_service = MediaService(supabase)


@app.post("/api/media")
async def upload_media(
    file: UploadFile = File(...),
    uploader_pubkey: str = None
):
    """Upload media file"""
    req_id = new_request_id()
    logger.info("Uploading media", extra={
        "req_id": req_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "uploader_pubkey": uploader_pubkey
    })
    
    try:
        # Read file data
        file_data = await file.read()
        
        # Upload via media service
        result = await media_service.upload_file(
            file_data=file_data,
            filename=file.filename,
            content_type=file.content_type,
            uploader_pubkey=uploader_pubkey
        )
        
        logger.info("Media uploaded successfully", extra={
            "req_id": req_id,
            "media_id": result["id"],
            "url": result["url"]
        })
        
        return envelope(True, result)
        
    except ValueError as e:
        logger.warning("Validation error", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "VALIDATION_ERROR", "message": str(e)}, 400)
    except Exception as e:
        logger.error("Failed to upload media", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "INTERNAL_ERROR", "message": "Failed to upload media"}, 500)


@app.get("/api/media/{media_id}")
async def get_media(media_id: str):
    """Get media information"""
    req_id = new_request_id()
    logger.info("Fetching media", extra={"req_id": req_id, "media_id": media_id})
    
    try:
        media = await media_service.get_media(media_id)
        
        if not media:
            return envelope(False, None, {"code": "NOT_FOUND", "message": "Media not found"}, 404)
        
        logger.info("Media fetched successfully", extra={"req_id": req_id})
        return envelope(True, media)
        
    except Exception as e:
        logger.error("Failed to fetch media", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "INTERNAL_ERROR", "message": "Failed to fetch media"}, 500)
