-- DevScope AI Initial Schema Migration
-- Preserves existing tables from Express + Postgres implementation.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Will map to auth.users in the future, for now UUID from Supabase Auth
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: We omit "password" from users because Supabase Auth handles passwords securely.
-- If migrating existing users, their passwords will need to be re-set or imported via Supabase Auth APIs.

CREATE TABLE IF NOT EXISTS analyses (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    github_username TEXT,
    scores JSONB,
    github_data JSONB,
    resume_data JSONB,
    linkedin_data JSONB,
    linkedin_url TEXT,
    intelligence_data JSONB,
    target_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_histories (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source_data JSONB,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    github_username TEXT,
    source_data JSONB,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linkedin_analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    linkedin_url TEXT,
    source_data JSONB,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_matches (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_description TEXT,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_gap_analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_analyses (
    repo_hash TEXT PRIMARY KEY,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linkedin_rapidapi_cache (
    username TEXT PRIMARY KEY,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    requests_today INTEGER NOT NULL DEFAULT 0,
    cache_hits INTEGER NOT NULL DEFAULT 0,
    total_response_time_ms BIGINT NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Future RAG Support setup
CREATE TABLE IF NOT EXISTS document_embeddings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768), -- Assuming Gemini embeddings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- For analysis tables, users can manage their own data
CREATE POLICY "Users manage their own analyses" ON analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own chat histories" ON chat_histories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own resume analyses" ON resume_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own github analyses" ON github_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own linkedin analyses" ON linkedin_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own job matches" ON job_matches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own candidate reports" ON candidate_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own project gap analyses" ON project_gap_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own document embeddings" ON document_embeddings FOR ALL USING (auth.uid() = user_id);

-- System tables (cache, usage) are not exposed to RLS, accessible by service role only

-- Setup Supabase Storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

-- Set up RLS for storage
CREATE POLICY "Users can upload their own resumes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
