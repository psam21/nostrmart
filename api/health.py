from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
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
