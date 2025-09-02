from __future__ import annotations
import httpx
import logging
from typing import Dict, List, Optional, Any
from app.core.config import Settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase REST API client with retry and timeout"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = f"{settings.SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Service role headers for admin operations
        self.service_headers = None
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            self.service_headers = {
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        use_service_role: bool = False
    ) -> Dict[str, Any]:
        """Make HTTP request with retry and timeout"""
        url = f"{self.base_url}/{endpoint}"
        headers = self.service_headers if use_service_role else self.headers
        
        timeout = httpx.Timeout(
            connect=self.settings.HTTP_CONNECT_TIMEOUT,
            read=self.settings.HTTP_READ_TIMEOUT
        )
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(self.settings.HTTP_RETRY_MAX + 1):
                try:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        json=data,
                        params=params
                    )
                    response.raise_for_status()
                    return response.json()
                    
                except httpx.HTTPError as e:
                    logger.warning(f"HTTP request failed (attempt {attempt + 1})", extra={
                        "method": method,
                        "url": url,
                        "error": str(e),
                        "attempt": attempt + 1
                    })
                    
                    if attempt == self.settings.HTTP_RETRY_MAX:
                        raise
                    
                    # Simple exponential backoff
                    import asyncio
                    await asyncio.sleep(0.1 * (2 ** attempt))
    
    async def insert_nostr_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new Nostr event"""
        return await self._make_request(
            method="POST",
            endpoint="nostr_events",
            data=event_data
        )
    
    async def get_nostr_events(
        self, 
        pubkey: Optional[str] = None,
        kind: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get Nostr events with filtering"""
        params = {
            "limit": limit,
            "offset": offset,
            "order": "created_at.desc"
        }
        
        if pubkey:
            params["pubkey"] = f"eq.{pubkey}"
        if kind is not None:
            params["kind"] = f"eq.{kind}"
        
        result = await self._make_request(
            method="GET",
            endpoint="nostr_events",
            params=params
        )
        
        return result if isinstance(result, list) else []
    
    async def get_nostr_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific Nostr event by ID"""
        params = {"id": f"eq.{event_id}"}
        
        result = await self._make_request(
            method="GET",
            endpoint="nostr_events",
            params=params
        )
        
        return result[0] if result and len(result) > 0 else None
    
    async def insert_media_object(self, media_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new media object"""
        return await self._make_request(
            method="POST",
            endpoint="media_objects",
            data=media_data,
            use_service_role=True  # Media uploads might need service role
        )
    
    async def get_media_object(self, media_id: str) -> Optional[Dict[str, Any]]:
        """Get a media object by ID"""
        params = {"id": f"eq.{media_id}"}
        
        result = await self._make_request(
            method="GET",
            endpoint="media_objects",
            params=params
        )
        
        return result[0] if result and len(result) > 0 else None
    
    async def get_media_objects_by_pubkey(
        self, 
        pubkey: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get media objects by uploader pubkey"""
        params = {
            "uploader_pubkey": f"eq.{pubkey}",
            "limit": limit,
            "offset": offset,
            "order": "created_at.desc"
        }
        
        result = await self._make_request(
            method="GET",
            endpoint="media_objects",
            params=params
        )
        
        return result if isinstance(result, list) else []
