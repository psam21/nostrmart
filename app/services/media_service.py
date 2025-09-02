from __future__ import annotations
import hashlib
import logging
from typing import Optional, Dict, Any
from app.models.nostr import MediaObject
from app.adapters.supabase_client import SupabaseClient
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MediaService:
    """Service for handling media uploads and management"""
    
    def __init__(self, supabase: SupabaseClient):
        self.supabase = supabase
        self.allowed_mime_types = self._parse_allowed_mime_types()
        self.max_file_size = settings.MAX_EVENT_BYTES  # Use same limit for now
    
    def _parse_allowed_mime_types(self) -> Optional[list]:
        """Parse allowed MIME types from environment variable"""
        if not settings.MEDIA_ALLOWED_MIME:
            return None
        
        return [mime.strip() for mime in settings.MEDIA_ALLOWED_MIME.split(',')]
    
    def _validate_file(self, file_data: bytes, filename: str, content_type: str) -> None:
        """Validate uploaded file"""
        # Check file size
        if len(file_data) > self.max_file_size:
            raise ValueError(f"File too large. Maximum size: {self.max_file_size} bytes")
        
        # Check MIME type if restrictions are configured
        if self.allowed_mime_types and content_type not in self.allowed_mime_types:
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(self.allowed_mime_types)}")
        
        # Basic filename validation
        if not filename or len(filename) > 255:
            raise ValueError("Invalid filename")
        
        # Check for dangerous file extensions
        dangerous_extensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js']
        filename_lower = filename.lower()
        if any(filename_lower.endswith(ext) for ext in dangerous_extensions):
            raise ValueError("File type not allowed for security reasons")
    
    def _calculate_checksum(self, file_data: bytes) -> str:
        """Calculate SHA-256 checksum of file data"""
        return hashlib.sha256(file_data).hexdigest()
    
    async def upload_file(
        self, 
        file_data: bytes, 
        filename: str, 
        content_type: str,
        uploader_pubkey: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload a file and create media object record"""
        # Validate file
        self._validate_file(file_data, filename, content_type)
        
        # Calculate checksum
        checksum = self._calculate_checksum(file_data)
        
        # TODO: Upload to actual storage (Blossom protocol or Supabase Storage)
        # For now, we'll create a placeholder URL
        # In production, this would upload to Blossom or Supabase Storage
        storage_url = f"https://placeholder.storage/{checksum}/{filename}"
        
        logger.info("File upload placeholder", extra={
            "filename": filename,
            "size": len(file_data),
            "checksum": checksum,
            "content_type": content_type
        })
        
        # Create media object record
        media_data = {
            "url": storage_url,
            "uploader_pubkey": uploader_pubkey or "anonymous",
            "size_bytes": len(file_data),
            "mime_type": content_type,
            "checksum": checksum
        }
        
        result = await self.supabase.insert_media_object(media_data)
        
        return {
            "id": result[0]["id"] if isinstance(result, list) else result["id"],
            "url": storage_url,
            "size_bytes": len(file_data),
            "mime_type": content_type,
            "checksum": checksum
        }
    
    async def get_media(self, media_id: str) -> Optional[Dict[str, Any]]:
        """Get media object by ID"""
        return await self.supabase.get_media_object(media_id)
    
    async def get_media_by_pubkey(
        self, 
        pubkey: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> list[Dict[str, Any]]:
        """Get media objects by uploader pubkey"""
        return await self.supabase.get_media_objects_by_pubkey(pubkey, limit, offset)
