import json
import uuid
from typing import Dict, List, Optional, Any
from app.adapters.supabase_client import SupabaseClient
from app.models.nostr import NostrEvent, NostrEventCreate

class NostrService:
    """Service for handling Nostr events with Supabase backend"""
    
    def __init__(self):
        self.supabase = SupabaseClient()
    
    async def create_event(self, event_data: NostrEventCreate) -> Dict[str, Any]:
        """Create a new Nostr event"""
        try:
            # Generate a unique ID if not provided
            event_id = event_data.id or str(uuid.uuid4())
            
            # Check if event already exists
            existing = await self.supabase.get_nostr_event_by_id(event_id)
            if "error" not in existing:
                return {
                    "ok": False,
                    "error": {"code": "EVENT_EXISTS", "message": "Event with this ID already exists"}
                }
            
            # Prepare data for database
            db_data = {
                "id": event_id,
                "pubkey": event_data.pubkey,
                "kind": event_data.kind,
                "content": event_data.content,
                "tags": json.dumps(event_data.tags) if event_data.tags else "[]",
                "sig": event_data.sig
            }
            
            # Insert into database
            result = await self.supabase.insert_nostr_event(db_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": event_id,
                    "message": "Event created successfully",
                    "event": result
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_events(self, pubkey: Optional[str] = None, kind: Optional[int] = None,
                        limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get Nostr events with optional filtering"""
        try:
            # Validate parameters
            if limit > 100:
                limit = 100
            if limit < 1:
                limit = 50
            if offset < 0:
                offset = 0
            
            # Get events from database
            events_data = await self.supabase.get_nostr_events(
                pubkey=pubkey,
                kind=kind,
                limit=limit,
                offset=offset
            )
            
            if "error" in events_data:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": events_data["error"]}
                }
            
            # Parse tags from JSON strings
            events = []
            if isinstance(events_data, list):
                for event in events_data:
                    if isinstance(event.get("tags"), str):
                        try:
                            event["tags"] = json.loads(event["tags"])
                        except json.JSONDecodeError:
                            event["tags"] = []
                    events.append(event)
            
            return {
                "ok": True,
                "data": {
                    "events": events,
                    "count": len(events),
                    "limit": limit,
                    "offset": offset,
                    "filters": {
                        "pubkey": pubkey,
                        "kind": kind
                    }
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_event_by_id(self, event_id: str) -> Dict[str, Any]:
        """Get a specific Nostr event by ID"""
        try:
            event_data = await self.supabase.get_nostr_event_by_id(event_id)
            
            if "error" in event_data:
                return {
                    "ok": False,
                    "error": {"code": "NOT_FOUND", "message": "Event not found"}
                }
            
            # Parse tags from JSON string
            if isinstance(event_data.get("tags"), str):
                try:
                    event_data["tags"] = json.loads(event_data["tags"])
                except json.JSONDecodeError:
                    event_data["tags"] = []
            
            return {
                "ok": True,
                "data": {
                    "event": event_data
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
