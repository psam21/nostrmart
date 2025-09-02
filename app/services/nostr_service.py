from __future__ import annotations
import logging
from typing import List, Optional
from app.models.nostr import NostrEvent, NostrEventCreate
from app.adapters.supabase_client import SupabaseClient

logger = logging.getLogger(__name__)


class NostrService:
    """Service for handling Nostr events"""
    
    def __init__(self, supabase: SupabaseClient):
        self.supabase = supabase
    
    async def create_event(self, event_data: NostrEventCreate) -> NostrEvent:
        """Create and validate a new Nostr event"""
        # Check if event already exists (deduplication)
        existing = await self.supabase.get_nostr_event_by_id(event_data.id)
        if existing:
            logger.info("Event already exists", extra={"event_id": event_data.id})
            # Return existing event
            return NostrEvent(**existing)
        
        # TODO: Implement signature verification
        # For now, we'll skip signature verification as mentioned in todo.md
        logger.info("Signature verification placeholder", extra={"event_id": event_data.id})
        
        # Convert to database format
        db_data = {
            "id": event_data.id,
            "pubkey": event_data.pubkey,
            "kind": event_data.kind,
            "created_at": event_data.created_at,
            "tags": event_data.tags,
            "content": event_data.content,
            "sig": event_data.sig
        }
        
        # Insert into database
        result = await self.supabase.insert_nostr_event(db_data)
        
        # Return the created event
        return NostrEvent(**result[0] if isinstance(result, list) else result)
    
    async def get_events(
        self, 
        pubkey: Optional[str] = None,
        kind: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[NostrEvent]:
        """Get Nostr events with filtering"""
        events_data = await self.supabase.get_nostr_events(
            pubkey=pubkey,
            kind=kind,
            limit=limit,
            offset=offset
        )
        
        return [NostrEvent(**event_data) for event_data in events_data]
    
    async def get_event_by_id(self, event_id: str) -> Optional[NostrEvent]:
        """Get a specific Nostr event by ID"""
        event_data = await self.supabase.get_nostr_event_by_id(event_id)
        if event_data:
            return NostrEvent(**event_data)
        return None
    
    def verify_signature(self, event: NostrEvent) -> bool:
        """Verify Nostr event signature (placeholder implementation)"""
        # TODO: Implement actual signature verification
        # This is a placeholder as mentioned in the todo.md
        logger.info("Signature verification not implemented", extra={"event_id": event.id})
        return True
