-- Add cloud_enabled preference to users table
-- Defaults to TRUE so existing users keep cloud functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS cloud_enabled BOOLEAN NOT NULL DEFAULT TRUE;
