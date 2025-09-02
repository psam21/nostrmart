from fastapi import FastAPI, HTTPException, Query
import os

app = FastAPI()


@app.get("/")
async def get_nostr_root():
    """Root endpoint for nostr API"""
    return {"message": "Nostr API is running", "endpoints": ["/events", "/event"]}


@app.get("/events")
async def get_nostr_events(
    pubkey: str = Query(None, description="Filter by public key"),
    kind: int = Query(None, description="Filter by event kind"),
    limit: int = Query(50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Number of events to skip")
):
    """Get Nostr events with optional filtering"""
    # For now, return a simple response
    return {
        "ok": True,
        "data": {
            "events": [],
            "count": 0,
            "limit": limit,
            "offset": offset
        }
    }


@app.post("/event")
async def create_nostr_event(event_data: dict):
    """Create a new Nostr event"""
    # For now, return a simple response
    return {
        "ok": True,
        "data": {
            "message": "Event creation endpoint ready",
            "received_data": event_data
        }
    }
