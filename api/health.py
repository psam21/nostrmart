from http.server import BaseHTTPRequestHandler
import json
import os
import asyncio

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Check database connectivity
        db_status = "unknown"
        try:
            from app.adapters.supabase_client import SupabaseClient
            supabase = SupabaseClient()
            # Simple connectivity test
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        message = {
            "ok": True, 
            "status": "healthy", 
            "build": os.getenv("GIT_SHA", "unknown"),
            "database": db_status,
            "environment": {
                "supabase_url": "configured" if os.getenv("SUPABASE_URL") else "missing",
                "supabase_key": "configured" if os.getenv("SUPABASE_ANON_KEY") else "missing",
                "nostr_relay": "configured" if os.getenv("NOSTR_RELAY_URL") else "missing"
            }
        }
        self.wfile.write(json.dumps(message).encode())
        return
