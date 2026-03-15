-- Cloud storage for user files
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cloud_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL,
  tool_used TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cloud_files_user_id ON cloud_files(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_files_created_at ON cloud_files(created_at);

ALTER TABLE cloud_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access cloud_files" ON cloud_files FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for user files (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', false) ON CONFLICT DO NOTHING;
