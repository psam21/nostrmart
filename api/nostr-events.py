from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        message = {
            "ok": True, 
            "data": {
                "events": [],
                "count": 0,
                "message": "Nostr events endpoint ready"
            }
        }
        self.wfile.write(json.dumps(message).encode())
        return
