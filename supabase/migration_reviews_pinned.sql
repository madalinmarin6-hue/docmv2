-- ============================================
-- Migration: Add pinned/hidden columns to reviews table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add pinned and hidden columns to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for faster pinned review queries on the main page
CREATE INDEX IF NOT EXISTS idx_reviews_pinned ON reviews(pinned) WHERE pinned = TRUE AND hidden = FALSE;
