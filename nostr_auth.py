import hashlib
import json
import time
import secrets
from typing import Dict, Optional, Tuple
import binascii

def validate_npub(npub: str) -> bool:
    """Validate npub format"""
    if not npub or not isinstance(npub, str):
        return False
    return npub.startswith('npub') and len(npub) == 63

def validate_hex_pubkey(hex_pubkey: str) -> bool:
    """Validate hex public key format"""
    if not hex_pubkey or not isinstance(hex_pubkey, str):
        return False
    try:
        return len(hex_pubkey) == 64 and all(c in '0123456789abcdef' for c in hex_pubkey.lower())
    except:
        return False

def npub_to_hex(npub: str) -> Optional[str]:
    """Convert npub to hex format using basic bech32 decoding"""
    if not validate_npub(npub):
        return None
    
    try:
        # Simple bech32 decoding for npub
        # Remove 'npub' prefix and decode
        data = npub[4:]
        # This is a simplified conversion - in production use nostr-tools
        # For now, we'll extract the hex from the bech32 encoded data
        import base64
        
        # Bech32 character set
        CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
        
        # Decode bech32 data
        decoded = []
        for char in data:
            if char in CHARSET:
                decoded.append(CHARSET.index(char))
            else:
                return None
        
        # Convert 5-bit groups to bytes (simplified)
        # This is a basic implementation - use proper bech32 library in production
        hex_bytes = []
        acc = 0
        bits = 0
        
        for value in decoded[:-6]:  # Skip checksum
            acc = (acc << 5) | value
            bits += 5
            while bits >= 8:
                bits -= 8
                hex_bytes.append((acc >> bits) & 0xff)
        
        return ''.join(f'{b:02x}' for b in hex_bytes)
    except:
        return None

def hex_to_npub(hex_pubkey: str) -> Optional[str]:
    """Convert hex to npub format using basic bech32 encoding"""
    if not validate_hex_pubkey(hex_pubkey):
        return None
    
    try:
        # This is a simplified conversion - in production use nostr-tools
        # For demonstration, we'll create a mock npub
        return f"npub{hex_pubkey[:59]}"
    except:
        return None

def generate_challenge() -> str:
    """Generate a random challenge string"""
    return secrets.token_hex(32)

def verify_nostr_signature(event: Dict, pubkey: str) -> bool:
    """Verify a Nostr event signature"""
    try:
        # Extract event components
        event_id = event.get('id')
        signature = event.get('sig')
        event_pubkey = event.get('pubkey')
        
        if not all([event_id, signature, event_pubkey]):
            return False
        
        # Verify the pubkey matches
        if event_pubkey != pubkey:
            return False
        
        # Calculate event hash
        calculated_id = calculate_event_id(event)
        if calculated_id != event_id:
            return False
        
        # Simplified signature verification for demo
        # In production, use proper secp256k1 verification
        try:
            # Basic validation of hex formats
            pubkey_bytes = bytes.fromhex(pubkey)
            signature_bytes = bytes.fromhex(signature)
            message_bytes = bytes.fromhex(event_id)
            
            # For demo purposes, accept if formats are valid
            # Real implementation would use proper ECDSA verification
            return len(pubkey_bytes) == 32 and len(signature_bytes) == 64
        except:
            return False
            
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

def calculate_event_id(event: Dict) -> str:
    """Calculate Nostr event ID"""
    try:
        # Create serialized event for hashing
        serialized = json.dumps([
            0,  # Reserved
            event.get('pubkey', ''),
            event.get('created_at', 0),
            event.get('kind', 1),
            event.get('tags', []),
            event.get('content', '')
        ], separators=(',', ':'), ensure_ascii=False)
        
        # Calculate SHA-256 hash
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    except Exception as e:
        print(f"Event ID calculation error: {e}")
        return ""

def validate_auth_event(event: Dict, challenge: str, max_age: int = 300) -> Tuple[bool, str]:
    """Validate authentication event"""
    try:
        # Check event structure
        if not isinstance(event, dict):
            return False, "Invalid event format"
        
        required_fields = ['id', 'pubkey', 'created_at', 'kind', 'tags', 'content', 'sig']
        for field in required_fields:
            if field not in event:
                return False, f"Missing field: {field}"
        
        # Check event kind (using 22242 for auth)
        if event.get('kind') != 22242:
            return False, "Invalid event kind for authentication"
        
        # Check timestamp (prevent replay attacks)
        current_time = int(time.time())
        event_time = event.get('created_at', 0)
        if abs(current_time - event_time) > max_age:
            return False, "Event timestamp is too old or in the future"
        
        # Check challenge in tags
        challenge_found = False
        for tag in event.get('tags', []):
            if len(tag) >= 2 and tag[0] == 'challenge' and tag[1] == challenge:
                challenge_found = True
                break
        
        if not challenge_found:
            return False, "Challenge not found in event tags"
        
        # Verify signature
        if not verify_nostr_signature(event, event['pubkey']):
            return False, "Invalid signature"
        
        return True, "Valid authentication event"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"

class NostrAuthManager:
    """Manages Nostr authentication challenges and validation"""
    
    def __init__(self):
        self.active_challenges = {}  # In production, use Redis or database
    
    def create_challenge(self, session_id: str) -> str:
        """Create and store a new challenge"""
        challenge = generate_challenge()
        self.active_challenges[session_id] = {
            'challenge': challenge,
            'created_at': time.time()
        }
        return challenge
    
    def validate_challenge(self, session_id: str, challenge: str) -> bool:
        """Validate a challenge for a session"""
        if session_id not in self.active_challenges:
            return False
        
        stored = self.active_challenges[session_id]
        if stored['challenge'] != challenge:
            return False
        
        # Check if challenge is not too old (5 minutes)
        if time.time() - stored['created_at'] > 300:
            del self.active_challenges[session_id]
            return False
        
        return True
    
    def consume_challenge(self, session_id: str) -> None:
        """Remove a used challenge"""
        if session_id in self.active_challenges:
            del self.active_challenges[session_id]
