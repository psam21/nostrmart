import json
import uuid
from typing import Dict, Optional, Any
from app.adapters.supabase_client import SupabaseClient

class MediaService:
    """Service for handling media objects with Supabase backend"""
    
    def __init__(self):
        self.supabase = SupabaseClient()
    
    async def upload_file(self, filename: str, content_type: str, size_bytes: int,
                         uploader_pubkey: str, blob_url: Optional[str] = None,
                         metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Upload a media file and create database record"""
        try:
            # Generate unique ID
            media_id = str(uuid.uuid4())
            
            # Prepare data for database
            media_data = {
                "id": media_id,
                "uploader_pubkey": uploader_pubkey,
                "filename": filename,
                "content_type": content_type,
                "size_bytes": size_bytes,
                "blob_url": blob_url,
                "metadata": json.dumps(metadata) if metadata else "{}"
            }
            
            # Insert into database
            result = await self.supabase.insert_media_object(media_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": media_id,
                    "filename": filename,
                    "content_type": content_type,
                    "size_bytes": size_bytes,
                    "uploader_pubkey": uploader_pubkey,
                    "blob_url": blob_url,
                    "message": "Media uploaded successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_media(self, media_id: str) -> Dict[str, Any]:
        """Get media information by ID"""
        try:
            media_data = await self.supabase.get_media_object(media_id)
            
            if "error" in media_data:
                return {
                    "ok": False,
                    "error": {"code": "NOT_FOUND", "message": "Media not found"}
                }
            
            # Parse metadata from JSON string
            if isinstance(media_data.get("metadata"), str):
                try:
                    media_data["metadata"] = json.loads(media_data["metadata"])
                except json.JSONDecodeError:
                    media_data["metadata"] = {}
            
            return {
                "ok": True,
                "data": {
                    "media": media_data
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_media_by_pubkey(self, pubkey: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get media objects by uploader pubkey"""
        try:
            # Validate parameters
            if limit > 100:
                limit = 100
            if limit < 1:
                limit = 50
            if offset < 0:
                offset = 0
            
            media_data = await self.supabase.get_media_objects_by_pubkey(
                pubkey=pubkey,
                limit=limit,
                offset=offset
            )
            
            if "error" in media_data:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": media_data["error"]}
                }
            
            # Parse metadata from JSON strings
            media_objects = []
            if isinstance(media_data, list):
                for media in media_data:
                    if isinstance(media.get("metadata"), str):
                        try:
                            media["metadata"] = json.loads(media["metadata"])
                        except json.JSONDecodeError:
                            media["metadata"] = {}
                    media_objects.append(media)
            
            return {
                "ok": True,
                "data": {
                    "media": media_objects,
                    "count": len(media_objects),
                    "limit": limit,
                    "offset": offset,
                    "uploader_pubkey": pubkey
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
