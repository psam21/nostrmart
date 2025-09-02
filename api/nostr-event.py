from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
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
