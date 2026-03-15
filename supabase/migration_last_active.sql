-- ============================================
-- Migration: Online tracking (last_active + active_visitors)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add last_active column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

-- Create active_visitors table for tracking all visitors (logged in + anonymous)
CREATE TABLE IF NOT EXISTS active_visitors (
  visitor_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE active_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access active_visitors" ON active_visitors FOR ALL USING (true) WITH CHECK (true);
