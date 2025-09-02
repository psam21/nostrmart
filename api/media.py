from http.server import BaseHTTPRequestHandler
import json
import asyncio
from urllib.parse import urlparse, parse_qs

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
                media_data = json.loads(post_data.decode('utf-8'))
            else:
                media_data = {}
            
            # Use Supabase service
            from app.services.media_service import MediaService
            
            media_service = MediaService()
            
            # Run async function
            result = asyncio.run(media_service.upload_file(
                filename=media_data.get('filename', 'unknown'),
                content_type=media_data.get('content_type', 'application/octet-stream'),
                size_bytes=media_data.get('size_bytes', 0),
                uploader_pubkey=media_data.get('uploader_pubkey', ''),
                blob_url=media_data.get('blob_url'),
                metadata=media_data.get('metadata', {})
            ))
            
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
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            media_id = query_params.get('id', [None])[0]
            pubkey = query_params.get('pubkey', [None])[0]
            limit = int(query_params.get('limit', [50])[0])
            offset = int(query_params.get('offset', [0])[0])
            
            # Use Supabase service
            from app.services.media_service import MediaService
            
            media_service = MediaService()
            
            if media_id:
                # Get specific media by ID
                result = asyncio.run(media_service.get_media(media_id))
            elif pubkey:
                # Get media by pubkey
                result = asyncio.run(media_service.get_media_by_pubkey(
                    pubkey=pubkey,
                    limit=limit,
                    offset=offset
                ))
            else:
                # Return error if no ID or pubkey provided
                result = {
                    "ok": False,
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": "Either 'id' or 'pubkey' parameter is required"
                    }
                }
            
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
