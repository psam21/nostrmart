from fastapi import FastAPI, UploadFile, File
import os

app = FastAPI()


@app.get("/")
async def get_media_root():
    """Root endpoint for media API"""
    return {"message": "Media API is running", "endpoints": ["POST /", "GET /{media_id}"]}


@app.post("/")
async def upload_media(
    file: UploadFile = File(...),
    uploader_pubkey: str = None
):
    """Upload media file"""
    # For now, return a simple response
    return {
        "ok": True,
        "data": {
            "message": "Media upload endpoint ready",
            "filename": file.filename,
            "content_type": file.content_type,
            "uploader_pubkey": uploader_pubkey
        }
    }


@app.get("/{media_id}")
async def get_media(media_id: str):
    """Get media information"""
    # For now, return a simple response
    return {
        "ok": True,
        "data": {
            "message": "Media retrieval endpoint ready",
            "media_id": media_id
        }
    }
