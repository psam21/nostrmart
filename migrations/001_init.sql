-- NostrMart Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create nostr_events table
CREATE TABLE IF NOT EXISTS nostr_events (
    id TEXT PRIMARY KEY,
    pubkey TEXT NOT NULL,
    kind INTEGER NOT NULL,
    content TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    sig TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_objects table
CREATE TABLE IF NOT EXISTS media_objects (
    id TEXT PRIMARY KEY,
    uploader_pubkey TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    blob_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nostr_events_pubkey ON nostr_events(pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_events_kind ON nostr_events(kind);
CREATE INDEX IF NOT EXISTS idx_nostr_events_created_at ON nostr_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_objects_uploader ON media_objects(uploader_pubkey);
CREATE INDEX IF NOT EXISTS idx_media_objects_created_at ON media_objects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE nostr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to nostr_events" ON nostr_events
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to media_objects" ON media_objects
    FOR SELECT USING (true);

-- Create policies for insert access (you may want to add authentication later)
CREATE POLICY "Allow public insert to nostr_events" ON nostr_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to media_objects" ON media_objects
    FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_nostr_events_updated_at 
    BEFORE UPDATE ON nostr_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_objects_updated_at 
    BEFORE UPDATE ON media_objects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
