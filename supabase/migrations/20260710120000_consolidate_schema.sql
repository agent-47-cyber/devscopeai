-- Migration: Consolidate Database Schema and Add Rate Limiting
-- Drops legacy modular tables and updates the main analyses table structure.

-- 1. Alter primary analyses table to include hash columns and raw candidate/AI data
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS resume_hash TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS github_hash TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS linkedin_hash TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS candidate_data JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS gemini_analysis JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS intelligence_data JSONB;

-- 2. Drop legacy modular tables
DROP TABLE IF EXISTS resume_analyses CASCADE;
DROP TABLE IF EXISTS github_analyses CASCADE;
DROP TABLE IF EXISTS linkedin_analyses CASCADE;
DROP TABLE IF EXISTS job_matches CASCADE;
DROP TABLE IF EXISTS candidate_reports CASCADE;
DROP TABLE IF EXISTS project_gap_analyses CASCADE;

-- 3. Create rate_limits table for security optimization
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- UUID from auth.users
    action TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, action)
);

-- Enable RLS for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to manage their own rate limits
CREATE POLICY "Users manage their own rate limits" 
    ON rate_limits 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
