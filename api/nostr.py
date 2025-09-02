from fastapi import FastAPI, HTTPException, Query
from app.core.config import get_settings
from app.core.logging import setup_logging, new_request_id
from app.core.response import envelope
from app.models.nostr import NostrEvent, NostrEventCreate
from app.services.nostr_service import NostrService
from app.adapters.supabase_client import SupabaseClient
import logging

settings = get_settings()
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI()
supabase = SupabaseClient(settings)
nostr_service = NostrService(supabase)


@app.post("/api/nostr/event")
async def create_nostr_event(event_data: NostrEventCreate):
    """Create a new Nostr event"""
    req_id = new_request_id()
    logger.info("Creating nostr event", extra={"req_id": req_id})
    
    try:
        # Validate and create event
        event = await nostr_service.create_event(event_data)
        
        logger.info("Event created successfully", extra={
            "req_id": req_id, 
            "event_id": event.id,
            "pubkey": event.pubkey
        })
        
        return envelope(True, event.dict())
        
    except ValueError as e:
        logger.warning("Validation error", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "VALIDATION_ERROR", "message": str(e)}, 400)
    except Exception as e:
        logger.error("Failed to create event", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "INTERNAL_ERROR", "message": "Failed to create event"}, 500)


@app.get("/api/nostr/events")
async def get_nostr_events(
    pubkey: str = Query(None, description="Filter by public key"),
    kind: int = Query(None, description="Filter by event kind"),
    limit: int = Query(50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Number of events to skip")
):
    """Get Nostr events with optional filtering"""
    req_id = new_request_id()
    logger.info("Fetching nostr events", extra={
        "req_id": req_id,
        "pubkey": pubkey,
        "kind": kind,
        "limit": limit,
        "offset": offset
    })
    
    try:
        events = await nostr_service.get_events(
            pubkey=pubkey,
            kind=kind,
            limit=limit,
            offset=offset
        )
        
        logger.info("Events fetched successfully", extra={
            "req_id": req_id,
            "count": len(events)
        })
        
        return envelope(True, {
            "events": [event.dict() for event in events],
            "count": len(events),
            "limit": limit,
            "offset": offset
        })
        
    except Exception as e:
        logger.error("Failed to fetch events", extra={"req_id": req_id, "error": str(e)})
        return envelope(False, None, {"code": "INTERNAL_ERROR", "message": "Failed to fetch events"}, 500)
