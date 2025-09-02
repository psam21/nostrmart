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
            
            listing_id = query_params.get('id', [None])[0]
            
            if listing_id:
                # Get specific listing
                from app.services.listings_service import ListingsService
                listings_service = ListingsService()
                result = asyncio.run(listings_service.get_listing(listing_id))
            else:
                # Search listings
                from app.services.listings_service import ListingsService, ListingSearch
                listings_service = ListingsService()
                
                # Parse search parameters
                search_params = ListingSearch(
                    query=query_params.get('q', [None])[0],
                    category=query_params.get('category', [None])[0],
                    min_price=int(query_params.get('min_price', [0])[0]) if query_params.get('min_price', [None])[0] else None,
                    max_price=int(query_params.get('max_price', [0])[0]) if query_params.get('max_price', [None])[0] else None,
                    location=query_params.get('location', [None])[0],
                    tags=query_params.get('tags', [None])[0].split(',') if query_params.get('tags', [None])[0] else None,
                    seller_pubkey=query_params.get('seller', [None])[0],
                    limit=int(query_params.get('limit', [20])[0]),
                    offset=int(query_params.get('offset', [0])[0]),
                    sort_by=query_params.get('sort_by', ['created_at'])[0],
                    sort_order=query_params.get('sort_order', ['desc'])[0]
                )
                
                result = asyncio.run(listings_service.search_listings(search_params))
            
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
                listing_data = json.loads(post_data.decode('utf-8'))
            else:
                listing_data = {}
            
            # Use ListingsService
            from app.services.listings_service import ListingsService, ListingCreate
            
            listings_service = ListingsService()
            
            # Create ListingCreate object
            listing_create = ListingCreate(
                title=listing_data.get('title', ''),
                description=listing_data.get('description'),
                price_sats=listing_data.get('price_sats', 0),
                category=listing_data.get('category'),
                condition=listing_data.get('condition'),
                location=listing_data.get('location'),
                images=listing_data.get('images', []),
                tags=listing_data.get('tags', []),
                seller_pubkey=listing_data.get('seller_pubkey', ''),
                nostr_event_id=listing_data.get('nostr_event_id')
            )
            
            # Run async function
            result = asyncio.run(listings_service.create_listing(listing_create))
            
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
    
    def do_PATCH(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse URL to get listing ID
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            listing_id = query_params.get('id', [None])[0]
            
            if not listing_id:
                error_response = {
                    "ok": False,
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": "Listing ID is required"
                    }
                }
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Read PATCH data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                patch_data = self.rfile.read(content_length)
                update_data = json.loads(patch_data.decode('utf-8'))
            else:
                update_data = {}
            
            # Use ListingsService
            from app.services.listings_service import ListingsService, ListingUpdate
            
            listings_service = ListingsService()
            
            # Create ListingUpdate object
            listing_update = ListingUpdate(**update_data)
            
            # Run async function
            result = asyncio.run(listings_service.update_listing(listing_id, listing_update))
            
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
    
    def do_DELETE(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse URL to get listing ID
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            listing_id = query_params.get('id', [None])[0]
            
            if not listing_id:
                error_response = {
                    "ok": False,
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": "Listing ID is required"
                    }
                }
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Use ListingsService
            from app.services.listings_service import ListingsService
            
            listings_service = ListingsService()
            
            # Run async function
            result = asyncio.run(listings_service.delete_listing(listing_id))
            
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
