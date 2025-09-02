import json
import uuid
from typing import Dict, List, Optional, Any
from app.adapters.supabase_client import SupabaseClient
from app.models.listings import (
    Listing, ListingCreate, ListingUpdate, ListingSearch,
    Purchase, PurchaseCreate, Review, ReviewCreate
)


class ListingsService:
    """Service for handling marketplace listings with Supabase backend"""
    
    def __init__(self):
        self.supabase = SupabaseClient()
    
    async def create_listing(self, listing_data: ListingCreate) -> Dict[str, Any]:
        """Create a new listing"""
        try:
            # Generate unique ID
            listing_id = str(uuid.uuid4())
            
            # Prepare data for database
            db_data = {
                "id": listing_id,
                "seller_pubkey": listing_data.seller_pubkey,
                "title": listing_data.title,
                "description": listing_data.description,
                "price_sats": listing_data.price_sats,
                "category": listing_data.category,
                "condition": listing_data.condition,
                "location": listing_data.location,
                "images": json.dumps(listing_data.images),
                "tags": json.dumps(listing_data.tags),
                "nostr_event_id": listing_data.nostr_event_id
            }
            
            # Insert into database
            result = await self.supabase.insert_listing(db_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": listing_id,
                    "message": "Listing created successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_listing(self, listing_id: str) -> Dict[str, Any]:
        """Get a specific listing by ID"""
        try:
            result = await self.supabase.get_listing(listing_id)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "NOT_FOUND", "message": "Listing not found"}
                }
            
            return {
                "ok": True,
                "data": result
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def search_listings(self, search_params: ListingSearch) -> Dict[str, Any]:
        """Search listings with filters"""
        try:
            result = await self.supabase.search_listings(
                query=search_params.query,
                category=search_params.category,
                min_price=search_params.min_price,
                max_price=search_params.max_price,
                location=search_params.location,
                tags=search_params.tags,
                seller_pubkey=search_params.seller_pubkey,
                limit=search_params.limit,
                offset=search_params.offset,
                sort_by=search_params.sort_by,
                sort_order=search_params.sort_order
            )
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": result
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def update_listing(self, listing_id: str, update_data: ListingUpdate) -> Dict[str, Any]:
        """Update a listing"""
        try:
            # Prepare update data
            db_data = {}
            for field, value in update_data.dict(exclude_unset=True).items():
                if field in ['images', 'tags'] and value is not None:
                    db_data[field] = json.dumps(value)
                else:
                    db_data[field] = value
            
            result = await self.supabase.update_listing(listing_id, db_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": listing_id,
                    "message": "Listing updated successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def delete_listing(self, listing_id: str) -> Dict[str, Any]:
        """Delete a listing"""
        try:
            result = await self.supabase.delete_listing(listing_id)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": listing_id,
                    "message": "Listing deleted successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def create_purchase(self, purchase_data: PurchaseCreate) -> Dict[str, Any]:
        """Create a new purchase"""
        try:
            purchase_id = str(uuid.uuid4())
            
            db_data = {
                "id": purchase_id,
                "listing_id": purchase_data.listing_id,
                "buyer_pubkey": purchase_data.buyer_pubkey,
                "seller_pubkey": purchase_data.seller_pubkey,
                "price_sats": purchase_data.price_sats,
                "nostr_event_id": purchase_data.nostr_event_id
            }
            
            result = await self.supabase.insert_purchase(db_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": purchase_id,
                    "message": "Purchase created successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def create_review(self, review_data: ReviewCreate) -> Dict[str, Any]:
        """Create a new review"""
        try:
            review_id = str(uuid.uuid4())
            
            db_data = {
                "id": review_id,
                "listing_id": review_data.listing_id,
                "reviewer_pubkey": review_data.reviewer_pubkey,
                "reviewee_pubkey": review_data.reviewee_pubkey,
                "rating": review_data.rating,
                "comment": review_data.comment,
                "nostr_event_id": review_data.nostr_event_id
            }
            
            result = await self.supabase.insert_review(db_data)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": {
                    "id": review_id,
                    "message": "Review created successfully"
                }
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
    
    async def get_listing_reviews(self, listing_id: str, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get reviews for a listing"""
        try:
            result = await self.supabase.get_listing_reviews(listing_id, limit, offset)
            
            if "error" in result:
                return {
                    "ok": False,
                    "error": {"code": "DATABASE_ERROR", "message": result["error"]}
                }
            
            return {
                "ok": True,
                "data": result
            }
            
        except Exception as e:
            return {
                "ok": False,
                "error": {"code": "SERVICE_ERROR", "message": str(e)}
            }
