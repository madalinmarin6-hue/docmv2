-- ============================================
-- Migration: Add total_files column to users table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add total_files counter to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_files INT NOT NULL DEFAULT 0;

-- Backfill total_files from existing file records
UPDATE users SET total_files = (
  SELECT COUNT(*) FROM files WHERE files.user_id = users.id
);
