from pydantic import BaseModel, Field, validator
from typing import List, Optional, Any
from datetime import datetime
import re


class NostrEvent(BaseModel):
    """Nostr event model"""
    id: str = Field(..., min_length=64, max_length=64, description="Event ID (64 character hex)")
    pubkey: str = Field(..., min_length=64, max_length=64, description="Public key (64 character hex)")
    kind: int = Field(..., ge=0, le=65535, description="Event kind")
    created_at: int = Field(..., description="Unix timestamp")
    tags: List[List[str]] = Field(default_factory=list, description="Event tags")
    content: str = Field(..., description="Event content")
    sig: str = Field(..., min_length=128, max_length=128, description="Event signature (128 character hex)")
    
    @validator('id', 'pubkey', 'sig')
    def validate_hex_strings(cls, v):
        if not re.match(r'^[a-fA-F0-9]+$', v):
            raise ValueError('Must be a valid hex string')
        return v.lower()
    
    @validator('created_at')
    def validate_timestamp(cls, v):
        if v < 0:
            raise ValueError('Timestamp must be positive')
        # Check if timestamp is reasonable (not too far in future/past)
        current_time = int(datetime.utcnow().timestamp())
        if v > current_time + 3600:  # 1 hour in future
            raise ValueError('Timestamp too far in future')
        if v < current_time - 31536000:  # 1 year in past
            raise ValueError('Timestamp too far in past')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if not isinstance(v, list):
            raise ValueError('Tags must be a list')
        for tag in v:
            if not isinstance(tag, list) or len(tag) == 0:
                raise ValueError('Each tag must be a non-empty list')
            if not all(isinstance(item, str) for item in tag):
                raise ValueError('All tag items must be strings')
        return v


class NostrEventCreate(BaseModel):
    """Nostr event creation model"""
    id: str = Field(..., min_length=64, max_length=64)
    pubkey: str = Field(..., min_length=64, max_length=64)
    kind: int = Field(..., ge=0, le=65535)
    created_at: int = Field(...)
    tags: List[List[str]] = Field(default_factory=list)
    content: str = Field(..., max_length=65536)  # MAX_EVENT_BYTES from config
    sig: str = Field(..., min_length=128, max_length=128)
    
    @validator('id', 'pubkey', 'sig')
    def validate_hex_strings(cls, v):
        if not re.match(r'^[a-fA-F0-9]+$', v):
            raise ValueError('Must be a valid hex string')
        return v.lower()
    
    @validator('created_at')
    def validate_timestamp(cls, v):
        if v < 0:
            raise ValueError('Timestamp must be positive')
        current_time = int(datetime.utcnow().timestamp())
        if v > current_time + 3600:
            raise ValueError('Timestamp too far in future')
        if v < current_time - 31536000:
            raise ValueError('Timestamp too far in past')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if not isinstance(v, list):
            raise ValueError('Tags must be a list')
        for tag in v:
            if not isinstance(tag, list) or len(tag) == 0:
                raise ValueError('Each tag must be a non-empty list')
            if not all(isinstance(item, str) for item in tag):
                raise ValueError('All tag items must be strings')
        return v


class MediaObject(BaseModel):
    """Media object model"""
    id: str = Field(..., description="Media object ID")
    url: str = Field(..., description="Media URL")
    uploader_pubkey: str = Field(..., min_length=64, max_length=64)
    size_bytes: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = Field(None)
    checksum: Optional[str] = Field(None)
    created_at: datetime = Field(..., description="Creation timestamp")
    
    @validator('uploader_pubkey')
    def validate_pubkey(cls, v):
        if not re.match(r'^[a-fA-F0-9]+$', v):
            raise ValueError('Must be a valid hex string')
        return v.lower()
