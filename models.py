from app import db
from datetime import datetime
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    npub = db.Column(db.String(63), unique=True, nullable=False)  # Nostr public key in npub format
    hex_pubkey = db.Column(db.String(64), unique=True, nullable=False)  # Hex format for internal use
    name = db.Column(db.String(100))
    location = db.Column(db.String(200))
    email = db.Column(db.String(120))
    profile_image = db.Column(db.String(500))  # Blossom URL
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    listings = db.relationship('Listing', backref='seller', lazy=True, cascade='all, delete-orphan')
    purchases = db.relationship('Purchase', backref='buyer', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'npub': self.npub,
            'name': self.name,
            'location': self.location,
            'email': self.email,
            'profile_image': self.profile_image,
            'bio': self.bio,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Integer, nullable=False)  # Price in satoshis
    condition = db.Column(db.String(50))  # new, like_new, good, fair, poor
    category = db.Column(db.String(100))
    location = db.Column(db.String(200))
    images = db.Column(db.Text)  # JSON array of Blossom URLs
    status = db.Column(db.String(20), default='active')  # active, sold, removed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    purchases = db.relationship('Purchase', backref='listing', lazy=True)

    def get_images(self):
        """Parse images JSON field"""
        if self.images:
            try:
                return json.loads(self.images)
            except:
                return []
        return []
    
    def set_images(self, image_list):
        """Set images as JSON"""
        self.images = json.dumps(image_list)
    
    def get_primary_image(self):
        """Get the first image or a placeholder"""
        images = self.get_images()
        return images[0] if images else None
    
    def price_in_btc(self):
        """Convert satoshis to BTC"""
        return self.price / 100000000 if self.price else 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'condition': self.condition,
            'category': self.category,
            'location': self.location,
            'images': self.get_images(),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'seller': self.seller.to_dict() if self.seller else None
        }

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Integer, nullable=False)  # Amount in satoshis
    payment_hash = db.Column(db.String(64))  # Mock Lightning payment hash
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Foreign keys
    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'payment_hash': self.payment_hash,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'listing': self.listing.to_dict() if self.listing else None,
            'buyer': self.buyer.to_dict() if self.buyer else None
        }
