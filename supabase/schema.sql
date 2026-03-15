-- ============================================
-- DocM - Supabase Database Schema
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================
-- TABLES
-- ==================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  nickname TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'friend')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token TEXT UNIQUE,
  reset_token TEXT UNIQUE,
  reset_token_exp TIMESTAMPTZ,
  avatar TEXT,
  daily_edits_used INT NOT NULL DEFAULT 0,
  daily_edits_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bonus_edits INT NOT NULL DEFAULT 0,
  total_files INT NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  premium_until TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions (NextAuth JWT, kept for compatibility)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  file_type TEXT NOT NULL,
  tool_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visits
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Stats (singleton row)
CREATE TABLE site_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_visits INT NOT NULL DEFAULT 0,
  total_users INT NOT NULL DEFAULT 0,
  total_files INT NOT NULL DEFAULT 0,
  total_conversions INT NOT NULL DEFAULT 0
);

-- Questions (Help Center)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL DEFAULT 'anonymous',
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bug Reports
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  text TEXT NOT NULL,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active Visitors (for online tracking)
CREATE TABLE active_visitors (
  visitor_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cloud Files (user storage)
CREATE TABLE cloud_files (
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

-- Access Logs (for admin panel)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT 'Guest',
  user_email TEXT,
  page TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================
-- INDEXES
-- ==================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verify_token ON users(verify_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at);
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_cloud_files_user_id ON cloud_files(user_id);
CREATE INDEX idx_cloud_files_created_at ON cloud_files(created_at);

-- ==================
-- FUNCTIONS
-- ==================

-- Auto-update updated_at on user changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment a site stat by name
CREATE OR REPLACE FUNCTION increment_stat(stat_name TEXT, increment_by INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  IF stat_name = 'total_visits' THEN
    UPDATE site_stats SET total_visits = total_visits + increment_by WHERE id = 'global';
  ELSIF stat_name = 'total_users' THEN
    UPDATE site_stats SET total_users = total_users + increment_by WHERE id = 'global';
  ELSIF stat_name = 'total_files' THEN
    UPDATE site_stats SET total_files = total_files + increment_by WHERE id = 'global';
  ELSIF stat_name = 'total_conversions' THEN
    UPDATE site_stats SET total_conversions = total_conversions + increment_by WHERE id = 'global';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- NOTE: We use service_role key in API routes, which bypasses RLS.
-- These policies are for direct client access if needed later.
CREATE POLICY "Service role full access users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access files" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access visits" ON visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access site_stats" ON site_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access bug_reports" ON bug_reports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE active_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access active_visitors" ON active_visitors FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access access_logs" ON access_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cloud_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access cloud_files" ON cloud_files FOR ALL USING (true) WITH CHECK (true);

-- ==================
-- SEED DATA
-- ==================

INSERT INTO site_stats (id, total_visits, total_users, total_files, total_conversions)
VALUES ('global', 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;
