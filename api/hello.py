from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        message = {"message": "Hello from Vercel Python!"}
        self.wfile.write(json.dumps(message).encode())
        return
