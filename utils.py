import re
from typing import Optional
from urllib.parse import urlparse

def format_price(satoshis: int) -> str:
    """Format satoshis as readable price"""
    if satoshis >= 100000000:  # 1 BTC
        btc = satoshis / 100000000
        return f"₿{btc:.8f}".rstrip('0').rstrip('.')
    elif satoshis >= 100000:  # 0.001 BTC
        btc = satoshis / 100000000
        return f"₿{btc:.6f}"
    else:
        return f"{satoshis:,} sats"

def satoshis_from_btc(btc_amount: float) -> int:
    """Convert BTC to satoshis"""
    return int(btc_amount * 100000000)

def validate_url(url: str) -> bool:
    """Validate if string is a valid URL"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove or replace dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = filename.strip()
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        max_name_len = 255 - len(ext) - 1 if ext else 255
        filename = name[:max_name_len] + ('.' + ext if ext else '')
    
    return filename

def get_file_extension(filename: str) -> Optional[str]:
    """Get file extension from filename"""
    try:
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else None
    except:
        return None

def get_content_type(filename: str) -> str:
    """Get MIME content type from filename"""
    ext = get_file_extension(filename)
    if not ext:
        return 'application/octet-stream'
    
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'json': 'application/json'
    }
    
    return content_types.get(ext, 'application/octet-stream')

def is_image_file(filename: str) -> bool:
    """Check if file is an image"""
    ext = get_file_extension(filename)
    return ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] if ext else False

def is_video_file(filename: str) -> bool:
    """Check if file is a video"""
    ext = get_file_extension(filename)
    return ext in ['mp4', 'webm', 'mov', 'avi'] if ext else False

def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text with ellipsis"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'

def generate_payment_hash() -> str:
    """Generate a mock Lightning payment hash"""
    import secrets
    return secrets.token_hex(32)

CONDITIONS = [
    ('new', 'New'),
    ('like_new', 'Like New'),
    ('good', 'Good'),
    ('fair', 'Fair'),
    ('poor', 'Poor')
]

CATEGORIES = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Automotive',
    'Health & Beauty',
    'Collectibles',
    'Art & Crafts',
    'Musical Instruments',
    'Other'
]
