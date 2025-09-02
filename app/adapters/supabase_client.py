import os
import httpx
import json
from typing import Dict, List, Optional, Any
from app.core.config import get_settings

class SupabaseClient:
    """Supabase REST API client for serverless functions"""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = f"{self.settings.SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": self.settings.SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {self.settings.SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Supabase"""
        url = f"{self.base_url}/{endpoint}"
        
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=self.settings.HTTP_CONNECT_TIMEOUT,
                read=self.settings.HTTP_READ_TIMEOUT,
                write=5.0,
                pool=5.0
            )
        ) as client:
            try:
                if method.upper() == "GET":
                    response = await client.get(url, headers=self.headers)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=self.headers, json=data)
                elif method.upper() == "PATCH":
                    response = await client.patch(url, headers=self.headers, json=data)
                elif method.upper() == "DELETE":
                    response = await client.delete(url, headers=self.headers)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                return response.json() if response.content else {}
                
            except httpx.HTTPStatusError as e:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
            except Exception as e:
                return {"error": f"Request failed: {str(e)}"}
    
    # Nostr Events Methods
    async def get_nostr_events(self, pubkey: Optional[str] = None, kind: Optional[int] = None, 
                             limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get Nostr events with optional filtering"""
        endpoint = "nostr_events"
        params = []
        
        if pubkey:
            params.append(f"pubkey=eq.{pubkey}")
        if kind:
            params.append(f"kind=eq.{kind}")
        
        params.append(f"limit={limit}")
        params.append(f"offset={offset}")
        params.append("order=created_at.desc")
        
        if params:
            endpoint += "?" + "&".join(params)
        
        return await self._make_request("GET", endpoint)
    
    async def get_nostr_event_by_id(self, event_id: str) -> Dict[str, Any]:
        """Get a specific Nostr event by ID"""
        endpoint = f"nostr_events?id=eq.{event_id}"
        result = await self._make_request("GET", endpoint)
        
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        return {"error": "Event not found"}
    
    async def insert_nostr_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new Nostr event"""
        return await self._make_request("POST", "nostr_events", event_data)
    
    # Media Objects Methods
    async def get_media_objects_by_pubkey(self, pubkey: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get media objects by uploader pubkey"""
        endpoint = f"media_objects?uploader_pubkey=eq.{pubkey}&limit={limit}&offset={offset}&order=created_at.desc"
        return await self._make_request("GET", endpoint)
    
    async def get_media_object(self, media_id: str) -> Dict[str, Any]:
        """Get a specific media object by ID"""
        endpoint = f"media_objects?id=eq.{media_id}"
        result = await self._make_request("GET", endpoint)
        
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        return {"error": "Media object not found"}
    
    async def insert_media_object(self, media_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new media object"""
        return await self._make_request("POST", "media_objects", media_data)
