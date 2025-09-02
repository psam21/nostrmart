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
            
            buyer_pubkey = query_params.get('buyer', [None])[0]
            seller_pubkey = query_params.get('seller', [None])[0]
            limit = int(query_params.get('limit', [20])[0])
            offset = int(query_params.get('offset', [0])[0])
            
            # Use Supabase client directly for purchases
            from app.adapters.supabase_client import SupabaseClient
            
            supabase = SupabaseClient()
            
            if buyer_pubkey:
                result = asyncio.run(supabase.get_purchases_by_buyer(buyer_pubkey, limit, offset))
            elif seller_pubkey:
                result = asyncio.run(supabase.get_purchases_by_seller(seller_pubkey, limit, offset))
            else:
                result = {
                    "ok": False,
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": "Either 'buyer' or 'seller' parameter is required"
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
                purchase_data = json.loads(post_data.decode('utf-8'))
            else:
                purchase_data = {}
            
            # Use ListingsService
            from app.services.listings_service import ListingsService, PurchaseCreate
            
            listings_service = ListingsService()
            
            # Create PurchaseCreate object
            purchase_create = PurchaseCreate(
                listing_id=purchase_data.get('listing_id', ''),
                buyer_pubkey=purchase_data.get('buyer_pubkey', ''),
                seller_pubkey=purchase_data.get('seller_pubkey', ''),
                price_sats=purchase_data.get('price_sats', 0),
                nostr_event_id=purchase_data.get('nostr_event_id')
            )
            
            # Run async function
            result = asyncio.run(listings_service.create_purchase(purchase_create))
            
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
