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
            
            listing_id = query_params.get('listing_id', [None])[0]
            reviewee_pubkey = query_params.get('reviewee', [None])[0]
            limit = int(query_params.get('limit', [20])[0])
            offset = int(query_params.get('offset', [0])[0])
            
            # Use Supabase client directly for reviews
            from app.adapters.supabase_client import SupabaseClient
            
            supabase = SupabaseClient()
            
            if listing_id:
                result = asyncio.run(supabase.get_listing_reviews(listing_id, limit, offset))
            elif reviewee_pubkey:
                result = asyncio.run(supabase.get_reviews_by_reviewee(reviewee_pubkey, limit, offset))
            else:
                result = {
                    "ok": False,
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": "Either 'listing_id' or 'reviewee' parameter is required"
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
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Read POST data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                review_data = json.loads(post_data.decode('utf-8'))
            else:
                review_data = {}
            
            # Use ListingsService
            from app.services.listings_service import ListingsService, ReviewCreate
            
            listings_service = ListingsService()
            
            # Create ReviewCreate object
            review_create = ReviewCreate(
                listing_id=review_data.get('listing_id', ''),
                reviewer_pubkey=review_data.get('reviewer_pubkey', ''),
                reviewee_pubkey=review_data.get('reviewee_pubkey', ''),
                rating=review_data.get('rating', 5),
                comment=review_data.get('comment'),
                nostr_event_id=review_data.get('nostr_event_id')
            )
            
            # Run async function
            result = asyncio.run(listings_service.create_review(review_create))
            
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
