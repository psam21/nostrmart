from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "NostrMart API is running", "status": "healthy"}

@app.get("/health")
async def health():
    return {"ok": True, "status": "healthy", "build": os.getenv("GIT_SHA", "unknown")}

@app.get("/nostr/events")
async def get_nostr_events():
    return {"ok": True, "data": {"events": [], "count": 0}}

@app.post("/nostr/event")
async def create_nostr_event(event_data: dict):
    return {"ok": True, "data": {"message": "Event creation endpoint ready"}}

@app.post("/media")
async def upload_media():
    return {"ok": True, "data": {"message": "Media upload endpoint ready"}}

@app.get("/media/{media_id}")
async def get_media(media_id: str):
    return {"ok": True, "data": {"message": "Media retrieval endpoint ready", "media_id": media_id}}
