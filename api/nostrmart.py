from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/nostrmart/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            message = {
                "ok": True, 
                "status": "healthy", 
                "build": os.getenv("GIT_SHA", "unknown")
            }
            self.wfile.write(json.dumps(message).encode())
            return
        
        elif self.path == '/api/nostrmart/nostr/events':
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
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            message = {"error": "Not found", "path": self.path}
            self.wfile.write(json.dumps(message).encode())
            return
    
    def do_POST(self):
        if self.path == '/api/nostrmart/nostr/event':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            message = {
                "ok": True, 
                "data": {
                    "message": "Event creation endpoint ready",
                    "received": True
                }
            }
            self.wfile.write(json.dumps(message).encode())
            return
        
        elif self.path == '/api/nostrmart/media':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            message = {
                "ok": True, 
                "data": {
                    "message": "Media upload endpoint ready"
                }
            }
            self.wfile.write(json.dumps(message).encode())
            return
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            message = {"error": "Not found", "path": self.path}
            self.wfile.write(json.dumps(message).encode())
            return
