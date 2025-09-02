from pydantic import BaseModel, Field, validator
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum


class ListingStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    DRAFT = "draft"
    ARCHIVED = "archived"


class PurchaseStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class Listing(BaseModel):
    """Listing model"""
    id: str = Field(..., description="Listing ID")
    seller_pubkey: str = Field(..., min_length=1, description="Seller's public key")
    title: str = Field(..., min_length=1, max_length=200, description="Listing title")
    description: Optional[str] = Field(None, max_length=2000, description="Listing description")
    price_sats: int = Field(..., ge=0, description="Price in satoshis")
    category: Optional[str] = Field(None, max_length=50, description="Product category")
    condition: Optional[str] = Field(None, max_length=50, description="Item condition")
    location: Optional[str] = Field(None, max_length=100, description="Location")
    images: List[str] = Field(default_factory=list, description="Image URLs")
    tags: List[str] = Field(default_factory=list, description="Listing tags")
    status: ListingStatus = Field(default=ListingStatus.ACTIVE, description="Listing status")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ListingCreate(BaseModel):
    """Listing creation model"""
    title: str = Field(..., min_length=1, max_length=200, description="Listing title")
    description: Optional[str] = Field(None, max_length=2000, description="Listing description")
    price_sats: int = Field(..., ge=0, description="Price in satoshis")
    category: Optional[str] = Field(None, max_length=50, description="Product category")
    condition: Optional[str] = Field(None, max_length=50, description="Item condition")
    location: Optional[str] = Field(None, max_length=100, description="Location")
    images: List[str] = Field(default_factory=list, description="Image URLs")
    tags: List[str] = Field(default_factory=list, description="Listing tags")
    seller_pubkey: str = Field(..., min_length=1, description="Seller's public key")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")


class ListingUpdate(BaseModel):
    """Listing update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Listing title")
    description: Optional[str] = Field(None, max_length=2000, description="Listing description")
    price_sats: Optional[int] = Field(None, ge=0, description="Price in satoshis")
    category: Optional[str] = Field(None, max_length=50, description="Product category")
    condition: Optional[str] = Field(None, max_length=50, description="Item condition")
    location: Optional[str] = Field(None, max_length=100, description="Location")
    images: Optional[List[str]] = Field(None, description="Image URLs")
    tags: Optional[List[str]] = Field(None, description="Listing tags")
    status: Optional[ListingStatus] = Field(None, description="Listing status")


class Purchase(BaseModel):
    """Purchase model"""
    id: str = Field(..., description="Purchase ID")
    listing_id: str = Field(..., description="Listing ID")
    buyer_pubkey: str = Field(..., min_length=1, description="Buyer's public key")
    seller_pubkey: str = Field(..., min_length=1, description="Seller's public key")
    price_sats: int = Field(..., ge=0, description="Price in satoshis")
    status: PurchaseStatus = Field(default=PurchaseStatus.PENDING, description="Purchase status")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class PurchaseCreate(BaseModel):
    """Purchase creation model"""
    listing_id: str = Field(..., description="Listing ID")
    buyer_pubkey: str = Field(..., min_length=1, description="Buyer's public key")
    seller_pubkey: str = Field(..., min_length=1, description="Seller's public key")
    price_sats: int = Field(..., ge=0, description="Price in satoshis")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")


class Review(BaseModel):
    """Review model"""
    id: str = Field(..., description="Review ID")
    listing_id: str = Field(..., description="Listing ID")
    reviewer_pubkey: str = Field(..., min_length=1, description="Reviewer's public key")
    reviewee_pubkey: str = Field(..., min_length=1, description="Reviewee's public key")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ReviewCreate(BaseModel):
    """Review creation model"""
    listing_id: str = Field(..., description="Listing ID")
    reviewer_pubkey: str = Field(..., min_length=1, description="Reviewer's public key")
    reviewee_pubkey: str = Field(..., min_length=1, description="Reviewee's public key")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")
    nostr_event_id: Optional[str] = Field(None, description="Associated Nostr event ID")


class ListingSearch(BaseModel):
    """Listing search parameters"""
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Category filter")
    min_price: Optional[int] = Field(None, ge=0, description="Minimum price in sats")
    max_price: Optional[int] = Field(None, ge=0, description="Maximum price in sats")
    location: Optional[str] = Field(None, description="Location filter")
    tags: Optional[List[str]] = Field(None, description="Tag filters")
    seller_pubkey: Optional[str] = Field(None, description="Seller filter")
    limit: int = Field(default=20, ge=1, le=100, description="Number of results")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")
