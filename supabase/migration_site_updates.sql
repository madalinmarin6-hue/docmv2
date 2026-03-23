-- Create site_updates table for admin/owner update log
CREATE TABLE IF NOT EXISTS site_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'update',
  author TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_updates ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON site_updates
  FOR ALL USING (true) WITH CHECK (true);
