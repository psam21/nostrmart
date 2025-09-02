-- NostrMart Database Schema
-- This migration creates the initial tables for the serverless NostrMart application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Nostr Events Table
-- Stores Nostr protocol events with full validation
CREATE TABLE IF NOT EXISTS nostr_events (
    id text PRIMARY KEY,
    pubkey text NOT NULL,
    kind int NOT NULL,
    created_at timestamptz NOT NULL,
    tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    content text NOT NULL,
    sig text NOT NULL,
    relay_received_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_pubkey_created_at ON nostr_events(pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_kind_created_at ON nostr_events(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON nostr_events(created_at DESC);

-- Media Objects Table
-- Stores metadata for uploaded media files
CREATE TABLE IF NOT EXISTS media_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url text NOT NULL,
    uploader_pubkey text NOT NULL,
    size_bytes int,
    mime_type text,
    checksum text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for media queries
CREATE INDEX IF NOT EXISTS idx_media_uploader_created_at ON media_objects(uploader_pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_checksum ON media_objects(checksum);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_objects(created_at DESC);

-- Row Level Security (RLS) - Enable after schema is stabilized
-- ALTER TABLE nostr_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media_objects ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (commented out for now)
-- CREATE POLICY "Allow public read access to nostr_events" ON nostr_events FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert to nostr_events" ON nostr_events FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public read access to media_objects" ON media_objects FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated insert to media_objects" ON media_objects FOR INSERT WITH CHECK (uploader_pubkey IS NOT NULL);
