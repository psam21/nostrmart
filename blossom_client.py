import requests
import hashlib
import json
import time
import logging
from typing import Dict, List, Optional, Tuple
from io import BytesIO

class BlossomClient:
    """Client for interacting with Blossom protocol servers"""
    
    def __init__(self, servers: Optional[List[str]] = None):
        self.servers = servers or [
            'https://blossom.primal.net',
            'https://blossom.band',
            'https://nostr.media'
        ]
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NostrMarketplace/1.0'
        })
    
    def calculate_file_hash(self, file_data: bytes) -> str:
        """Calculate SHA-256 hash of file data"""
        return hashlib.sha256(file_data).hexdigest()
    
    def upload_blob(self, file_data: bytes, filename: str, auth_event: Dict, 
                   content_type: Optional[str] = None) -> Optional[Dict]:
        """Upload a blob to Blossom servers"""
        try:
            file_hash = self.calculate_file_hash(file_data)
            
            # Try each server until one succeeds
            for server in self.servers:
                try:
                    result = self._upload_to_server(
                        server, file_data, filename, auth_event, content_type, file_hash
                    )
                    if result:
                        return result
                except Exception as e:
                    logging.warning(f"Upload failed to {server}: {e}")
                    continue
            
            logging.error("Upload failed to all servers")
            return None
            
        except Exception as e:
            logging.error(f"Blob upload error: {e}")
            return None
    
    def _upload_to_server(self, server: str, file_data: bytes, filename: str,
                         auth_event: Dict, content_type: Optional[str], file_hash: str) -> Optional[Dict]:
        """Upload to a specific Blossom server"""
        try:
            url = f"{server}/upload"
            
            # Prepare multipart form data
            files = {
                'file': (filename, BytesIO(file_data), content_type or 'application/octet-stream')
            }
            
            # Add authorization header with signed event
            headers = {
                'Authorization': f'Nostr {self._encode_auth_event(auth_event)}'
            }
            
            response = self.session.put(url, files=files, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'url': result.get('url', f"{server}/{file_hash}"),
                    'sha256': file_hash,
                    'size': len(file_data),
                    'type': content_type,
                    'server': server,
                    'uploaded': int(time.time())
                }
            else:
                logging.warning(f"Server {server} returned {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logging.error(f"Upload to {server} failed: {e}")
            return None
    
    def _encode_auth_event(self, event: Dict) -> str:
        """Encode authorization event for header"""
        try:
            # Base64 encode the JSON event
            import base64
            event_json = json.dumps(event, separators=(',', ':'))
            return base64.b64encode(event_json.encode()).decode()
        except:
            return ""
    
    def get_blob(self, sha256_hash: str) -> Optional[bytes]:
        """Retrieve a blob from Blossom servers"""
        try:
            # Try each server until one succeeds
            for server in self.servers:
                try:
                    url = f"{server}/{sha256_hash}"
                    response = self.session.get(url, timeout=30)
                    
                    if response.status_code == 200:
                        # Verify hash
                        received_hash = self.calculate_file_hash(response.content)
                        if received_hash == sha256_hash:
                            return response.content
                        else:
                            logging.warning(f"Hash mismatch from {server}")
                    
                except Exception as e:
                    logging.warning(f"Failed to get blob from {server}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logging.error(f"Blob retrieval error: {e}")
            return None
    
    def has_blob(self, sha256_hash: str) -> Tuple[bool, Optional[str]]:
        """Check if a blob exists on any server"""
        try:
            for server in self.servers:
                try:
                    url = f"{server}/{sha256_hash}"
                    response = self.session.head(url, timeout=10)
                    
                    if response.status_code == 200:
                        return True, server
                        
                except Exception as e:
                    continue
            
            return False, None
            
        except Exception as e:
            logging.error(f"Blob check error: {e}")
            return False, None
    
    def list_user_blobs(self, pubkey: str, auth_event: Optional[Dict] = None) -> List[Dict]:
        """List blobs uploaded by a user"""
        try:
            blobs = []
            
            for server in self.servers:
                try:
                    url = f"{server}/list/{pubkey}"
                    headers = {}
                    
                    if auth_event:
                        headers['Authorization'] = f'Nostr {self._encode_auth_event(auth_event)}'
                    
                    response = self.session.get(url, headers=headers, timeout=30)
                    
                    if response.status_code == 200:
                        server_blobs = response.json()
                        if isinstance(server_blobs, list):
                            blobs.extend(server_blobs)
                    
                except Exception as e:
                    logging.warning(f"Failed to list blobs from {server}: {e}")
                    continue
            
            # Remove duplicates based on SHA-256
            seen_hashes = set()
            unique_blobs = []
            for blob in blobs:
                if blob.get('sha256') not in seen_hashes:
                    seen_hashes.add(blob.get('sha256'))
                    unique_blobs.append(blob)
            
            return unique_blobs
            
        except Exception as e:
            logging.error(f"List blobs error: {e}")
            return []
    
    def delete_blob(self, sha256_hash: str, auth_event: Dict) -> bool:
        """Delete a blob from servers"""
        try:
            success_count = 0
            
            for server in self.servers:
                try:
                    url = f"{server}/{sha256_hash}"
                    headers = {
                        'Authorization': f'Nostr {self._encode_auth_event(auth_event)}'
                    }
                    
                    response = self.session.delete(url, headers=headers, timeout=30)
                    
                    if response.status_code in [200, 204, 404]:  # 404 is OK (already deleted)
                        success_count += 1
                    
                except Exception as e:
                    logging.warning(f"Failed to delete from {server}: {e}")
                    continue
            
            return success_count > 0
            
        except Exception as e:
            logging.error(f"Blob deletion error: {e}")
            return False
    
    def get_server_info(self, server: str) -> Optional[Dict]:
        """Get information about a Blossom server"""
        try:
            # Check if server supports HEAD /upload for requirements
            url = f"{server}/upload"
            response = self.session.head(url, timeout=10)
            
            info = {'server': server, 'available': response.status_code != 404}
            
            # Parse upload requirements from headers
            if 'X-Max-File-Size' in response.headers:
                info['max_file_size'] = int(response.headers['X-Max-File-Size'])
            
            if 'X-Supported-Types' in response.headers:
                info['supported_types'] = response.headers['X-Supported-Types'].split(',')
            
            return info
            
        except Exception as e:
            logging.warning(f"Failed to get server info for {server}: {e}")
            return {'server': server, 'available': False}

# Global Blossom client instance
blossom_client = BlossomClient()
