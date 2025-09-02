import json
import time
import logging
from datetime import datetime
from flask import render_template, request, session, redirect, url_for, flash, jsonify
from werkzeug.utils import secure_filename
from app import app, db
from models import User, Listing, Purchase
from nostr_auth import NostrAuthManager, validate_npub, validate_hex_pubkey, npub_to_hex, hex_to_npub, validate_auth_event
from blossom_client import blossom_client
from utils import format_price, satoshis_from_btc, sanitize_filename, get_content_type, is_image_file, generate_payment_hash, CONDITIONS, CATEGORIES

# Initialize auth manager
auth_manager = NostrAuthManager()

@app.route('/')
def index():
    """Homepage with featured listings"""
    try:
        # Get recent listings
        listings = Listing.query.filter_by(status='active').order_by(Listing.created_at.desc()).limit(12).all()
        
        return render_template('index.html', 
                             listings=listings, 
                             format_price=format_price)
    except Exception as e:
        logging.error(f"Index error: {e}")
        flash('Error loading listings', 'error')
        return render_template('index.html', listings=[])

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page with Nostr authentication"""
    if request.method == 'GET':
        # Generate challenge for browser extension auth
        challenge = auth_manager.create_challenge(session.get('session_id', 'default'))
        session['auth_challenge'] = challenge
        return render_template('login.html', challenge=challenge)
    
    try:
        data = request.get_json() if request.is_json else request.form
        auth_type = data.get('auth_type')
        
        if auth_type == 'extension':
            # NIP-07 browser extension authentication
            return handle_extension_auth(data)
        elif auth_type == 'manual':
            # Manual npub entry
            return handle_manual_auth(data)
        else:
            return jsonify({'success': False, 'error': 'Invalid authentication type'})
            
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'success': False, 'error': 'Authentication failed'})

def handle_extension_auth(data):
    """Handle NIP-07 extension authentication"""
    try:
        event = data.get('event')
        if not event:
            return jsonify({'success': False, 'error': 'No authentication event provided'})
        
        # Validate the authentication event
        challenge = session.get('auth_challenge')
        if not challenge:
            return jsonify({'success': False, 'error': 'No challenge found'})
        
        is_valid, error_msg = validate_auth_event(event, challenge)
        if not is_valid:
            return jsonify({'success': False, 'error': error_msg})
        
        # Get or create user
        hex_pubkey = event['pubkey']
        npub = hex_to_npub(hex_pubkey)
        
        user = User.query.filter_by(hex_pubkey=hex_pubkey).first()
        if not user:
            user = User()
            user.npub = npub
            user.hex_pubkey = hex_pubkey
            user.name = data.get('name', '')
            user.created_at = datetime.utcnow()
            db.session.add(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Store user in session
        session['user_id'] = user.id
        session['npub'] = user.npub
        
        # Consume the challenge
        auth_manager.consume_challenge(session.get('session_id', 'default'))
        
        return jsonify({
            'success': True, 
            'redirect': url_for('profile'),
            'user': user.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Extension auth error: {e}")
        return jsonify({'success': False, 'error': 'Authentication failed'})

def handle_manual_auth(data):
    """Handle manual npub authentication"""
    try:
        npub_input = data.get('npub', '').strip()
        
        if not npub_input:
            return jsonify({'success': False, 'error': 'Please enter your npub'})
        
        # Validate npub format
        if not validate_npub(npub_input):
            return jsonify({'success': False, 'error': 'Invalid npub format'})
        
        # Convert to hex
        hex_pubkey = npub_to_hex(npub_input)
        if not hex_pubkey:
            return jsonify({'success': False, 'error': 'Failed to process npub'})
        
        # Get or create user
        user = User.query.filter_by(hex_pubkey=hex_pubkey).first()
        if not user:
            user = User()
            user.npub = npub_input
            user.hex_pubkey = hex_pubkey
            user.name = data.get('name', '')
            user.created_at = datetime.utcnow()
            db.session.add(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Store user in session
        session['user_id'] = user.id
        session['npub'] = user.npub
        
        return jsonify({
            'success': True, 
            'redirect': url_for('profile'),
            'user': user.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Manual auth error: {e}")
        return jsonify({'success': False, 'error': 'Authentication failed'})

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/profile')
def profile():
    """User profile page"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            session.clear()
            return redirect(url_for('login'))
        
        # Get user's listings
        listings = Listing.query.filter_by(seller_id=user.id).order_by(Listing.created_at.desc()).all()
        
        # Get user's purchases
        purchases = Purchase.query.filter_by(buyer_id=user.id).order_by(Purchase.created_at.desc()).all()
        
        return render_template('profile.html', 
                             user=user, 
                             listings=listings, 
                             purchases=purchases,
                             format_price=format_price)
    except Exception as e:
        logging.error(f"Profile error: {e}")
        flash('Error loading profile', 'error')
        return redirect(url_for('index'))

@app.route('/profile/edit', methods=['POST'])
def edit_profile():
    """Edit user profile"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return redirect(url_for('login'))
        
        # Update profile fields
        user.name = request.form.get('name', '').strip()
        user.location = request.form.get('location', '').strip()
        user.email = request.form.get('email', '').strip()
        user.bio = request.form.get('bio', '').strip()
        
        db.session.commit()
        flash('Profile updated successfully', 'success')
        
    except Exception as e:
        logging.error(f"Profile edit error: {e}")
        flash('Error updating profile', 'error')
    
    return redirect(url_for('profile'))

@app.route('/create', methods=['GET', 'POST'])
def create_listing():
    """Create a new listing"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'GET':
        return render_template('create_listing.html', 
                             conditions=CONDITIONS, 
                             categories=CATEGORIES)
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return redirect(url_for('login'))
        
        # Get form data
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        price_btc = float(request.form.get('price', 0))
        condition = request.form.get('condition', '')
        category = request.form.get('category', '')
        location = request.form.get('location', '').strip()
        
        # Validate required fields
        if not all([title, description, price_btc > 0]):
            flash('Please fill in all required fields', 'error')
            return render_template('create_listing.html', 
                                 conditions=CONDITIONS, 
                                 categories=CATEGORIES)
        
        # Convert price to satoshis
        price_sats = satoshis_from_btc(price_btc)
        
        # Handle image uploads
        uploaded_files = request.files.getlist('images')
        image_urls = []
        
        for file in uploaded_files:
            if file and file.filename:
                try:
                    # Read file data
                    file_data = file.read()
                    filename = sanitize_filename(file.filename)
                    content_type = get_content_type(filename)
                    
                    # Create upload authorization event (simplified for demo)
                    auth_event = {
                        'kind': 24242,
                        'content': f'Upload {filename}',
                        'created_at': int(time.time()),
                        'tags': [
                            ['t', 'upload'],
                            ['expiration', str(int(time.time()) + 3600)]
                        ],
                        'pubkey': user.hex_pubkey,
                        'id': 'mock_id',  # In production, properly sign this
                        'sig': 'mock_sig'
                    }
                    
                    # Upload to Blossom
                    result = blossom_client.upload_blob(file_data, filename, auth_event, content_type)
                    if result:
                        image_urls.append(result['url'])
                    
                except Exception as e:
                    logging.error(f"File upload error: {e}")
                    flash(f'Failed to upload {file.filename}', 'warning')
        
        # Create listing
        listing = Listing()
        listing.title = title
        listing.description = description
        listing.price = price_sats
        listing.condition = condition
        listing.category = category
        listing.location = location
        listing.seller_id = user.id
        listing.status = 'active'
        
        listing.set_images(image_urls)
        
        db.session.add(listing)
        db.session.commit()
        
        flash('Listing created successfully', 'success')
        return redirect(url_for('listing_detail', listing_id=listing.id))
        
    except Exception as e:
        logging.error(f"Create listing error: {e}")
        flash('Error creating listing', 'error')
        return render_template('create_listing.html', 
                             conditions=CONDITIONS, 
                             categories=CATEGORIES)

@app.route('/listing/<int:listing_id>')
def listing_detail(listing_id):
    """View listing details"""
    try:
        listing = Listing.query.get_or_404(listing_id)
        
        # Check if user is logged in and is the seller
        is_seller = False
        if 'user_id' in session:
            is_seller = session['user_id'] == listing.seller_id
        
        return render_template('listing_detail.html', 
                             listing=listing, 
                             is_seller=is_seller,
                             format_price=format_price)
    except Exception as e:
        logging.error(f"Listing detail error: {e}")
        flash('Listing not found', 'error')
        return redirect(url_for('index'))

@app.route('/buy/<int:listing_id>', methods=['POST'])
def buy_listing(listing_id):
    """Purchase a listing (mock Lightning payment)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Please log in to make a purchase'})
    
    try:
        user = User.query.get(session['user_id'])
        listing = Listing.query.get_or_404(listing_id)
        
        if listing.status != 'active':
            return jsonify({'success': False, 'error': 'Listing is no longer available'})
        
        if listing.seller_id == user.id:
            return jsonify({'success': False, 'error': 'You cannot buy your own listing'})
        
        # Create mock Lightning payment
        payment_hash = generate_payment_hash()
        
        purchase = Purchase()
        purchase.buyer_id = user.id
        purchase.listing_id = listing.id
        purchase.amount = listing.price
        purchase.payment_hash = payment_hash
        purchase.status = 'completed'  # Mock as completed
        purchase.completed_at = datetime.utcnow()
        
        # Mark listing as sold
        listing.status = 'sold'
        
        db.session.add(purchase)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Purchase successful!',
            'payment_hash': payment_hash
        })
        
    except Exception as e:
        logging.error(f"Purchase error: {e}")
        return jsonify({'success': False, 'error': 'Purchase failed'})

@app.route('/search')
def search():
    """Search listings"""
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '')
        condition = request.args.get('condition', '')
        max_price = request.args.get('max_price', '')
        
        # Start with active listings
        listings_query = Listing.query.filter_by(status='active')
        
        # Apply filters
        if query:
            listings_query = listings_query.filter(
                db.or_(
                    Listing.title.contains(query),
                    Listing.description.contains(query)
                )
            )
        
        if category:
            listings_query = listings_query.filter_by(category=category)
        
        if condition:
            listings_query = listings_query.filter_by(condition=condition)
        
        if max_price:
            try:
                max_price_sats = satoshis_from_btc(float(max_price))
                listings_query = listings_query.filter(Listing.price <= max_price_sats)
            except:
                pass
        
        # Order by newest first
        listings = listings_query.order_by(Listing.created_at.desc()).all()
        
        return render_template('search.html',
                             listings=listings,
                             query=query,
                             category=category,
                             condition=condition,
                             max_price=max_price,
                             categories=CATEGORIES,
                             conditions=CONDITIONS,
                             format_price=format_price)
    
    except Exception as e:
        logging.error(f"Search error: {e}")
        flash('Search error', 'error')
        return render_template('search.html', 
                             listings=[], 
                             categories=CATEGORIES, 
                             conditions=CONDITIONS,
                             format_price=format_price)

@app.route('/api/challenge')
def api_get_challenge():
    """Get authentication challenge"""
    try:
        session_id = session.get('session_id', 'default')
        challenge = auth_manager.create_challenge(session_id)
        return jsonify({'challenge': challenge})
    except Exception as e:
        logging.error(f"Challenge API error: {e}")
        return jsonify({'error': 'Failed to generate challenge'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('base.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('base.html'), 500

# Template filters
@app.template_filter('format_price')
def format_price_filter(satoshis):
    return format_price(satoshis)
