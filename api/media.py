from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
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
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        message = {
            "ok": True, 
            "data": {
                "message": "Media retrieval endpoint ready"
            }
        }
        self.wfile.write(json.dumps(message).encode())
        return
