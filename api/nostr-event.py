from http.server import BaseHTTPRequestHandler
import json
import asyncio

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Read POST data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                event_data = json.loads(post_data.decode('utf-8'))
            else:
                event_data = {}
            
            # Use Supabase service
            from app.services.nostr_service import NostrService
            from app.models.nostr import NostrEventCreate
            
            nostr_service = NostrService()
            
            # Create NostrEventCreate object
            nostr_event = NostrEventCreate(
                id=event_data.get('id'),
                pubkey=event_data.get('pubkey', ''),
                kind=event_data.get('kind', 1),
                content=event_data.get('content', ''),
                tags=event_data.get('tags', []),
                sig=event_data.get('sig', '')
            )
            
            # Run async function
            result = asyncio.run(nostr_service.create_event(nostr_event))
            
            self.wfile.write(json.dumps(result).encode())
            
        except json.JSONDecodeError as e:
            error_response = {
                "ok": False,
                "error": {
                    "code": "INVALID_JSON",
                    "message": "Invalid JSON in request body"
                }
            }
            self.wfile.write(json.dumps(error_response).encode())
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
