-- ============================================
-- Migration: Visitor tracking (IP, page, location)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add tracking columns to active_visitors
ALTER TABLE active_visitors ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE active_visitors ADD COLUMN IF NOT EXISTS page TEXT DEFAULT '/';
ALTER TABLE active_visitors ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE active_visitors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE active_visitors ADD COLUMN IF NOT EXISTS first_seen TIMESTAMPTZ DEFAULT NOW();

-- Add daily_ad_claims columns to users (if not already present)
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_ad_claims INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_ad_claims_date DATE;

-- Index for faster online queries
CREATE INDEX IF NOT EXISTS idx_active_visitors_last_ping ON active_visitors(last_ping);
CREATE INDEX IF NOT EXISTS idx_active_visitors_user_id ON active_visitors(user_id);
