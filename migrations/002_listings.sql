-- NostrMart Listings Schema
-- Run this in your Supabase SQL editor after 001_init.sql

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    seller_pubkey TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_sats INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    condition TEXT,
    location TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft', 'archived')),
    nostr_event_id TEXT REFERENCES nostr_events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    buyer_pubkey TEXT NOT NULL,
    seller_pubkey TEXT NOT NULL,
    price_sats INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'disputed')),
    nostr_event_id TEXT REFERENCES nostr_events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    reviewer_pubkey TEXT NOT NULL,
    reviewee_pubkey TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    nostr_event_id TEXT REFERENCES nostr_events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_pubkey);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sats);

CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_pubkey);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller_pubkey);
CREATE INDEX IF NOT EXISTS idx_purchases_listing ON purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_pubkey);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_pubkey);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to listings" ON listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Allow public read access to purchases" ON purchases
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to reviews" ON reviews
    FOR SELECT USING (true);

-- Create policies for insert access
CREATE POLICY "Allow public insert to listings" ON listings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to purchases" ON purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Create policies for update access (sellers can update their listings)
CREATE POLICY "Allow sellers to update their listings" ON listings
    FOR UPDATE USING (true);

CREATE POLICY "Allow buyers to update their purchases" ON purchases
    FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON purchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
