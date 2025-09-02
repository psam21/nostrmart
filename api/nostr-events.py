from http.server import BaseHTTPRequestHandler
import json
import asyncio
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            pubkey = query_params.get('pubkey', [None])[0]
            kind = query_params.get('kind', [None])[0]
            limit = int(query_params.get('limit', [50])[0])
            offset = int(query_params.get('offset', [0])[0])
            
            if kind:
                kind = int(kind)
            
            # Use Supabase service
            from app.services.nostr_service import NostrService
            nostr_service = NostrService()
            
            # Run async function
            result = asyncio.run(nostr_service.get_events(
                pubkey=pubkey,
                kind=kind,
                limit=limit,
                offset=offset
            ))
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            error_response = {
                "ok": False,
                "error": {
                    "code": "ENDPOINT_ERROR",
                    "message": str(e)
                }
            }
            self.wfile.write(json.dumps(error_response).encode())
        return
