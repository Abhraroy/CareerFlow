-- Run these SQL commands in your Supabase SQL Editor to support the hybrid matching engine features.

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    parsed_data JSONB, -- stores structured JSON: seniority, location, education, etc.
    embedding vector(1536), -- text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Job Requirements Table
CREATE TABLE IF NOT EXISTS public.job_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    type TEXT NOT NULL, -- 'required_skill', 'preferred_skill', 'responsibility', 'experience', 'education'
    importance TEXT DEFAULT 'medium',
    embedding vector(1536)
);

-- 3. Resume Evidence (Sections) Table
CREATE TABLE IF NOT EXISTS public.resume_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL, -- 'summary', 'skills', 'experience', 'projects', 'education'
    content TEXT NOT NULL, -- textual content of the section/item
    embedding vector(1536)
);

-- 4. Job Matches Table
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    skill_score NUMERIC,
    experience_score NUMERIC,
    semantic_score NUMERIC,
    evidence JSONB, -- Detailed match evidence
    gaps JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Extend Resumes Table to support Tailoring Versioning
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS parent_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS target_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tailoring_metadata JSONB DEFAULT 'null';

-- 6. Candidate Facts (Persistent Knowledge) Table
CREATE TABLE IF NOT EXISTS public.candidate_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fact TEXT NOT NULL, -- e.g. "Expo", "React Native"
    category TEXT DEFAULT 'skills', -- 'skills', 'experience', 'projects', 'education'
    context TEXT, -- 'work', 'project', etc.
    source TEXT DEFAULT 'user_confirmed', -- 'resume', 'user_confirmed', 'user_rejected', 'user_corrected'
    confidence NUMERIC DEFAULT 1.0,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, fact)
);

-- 7. Add user_id to jobs if it doesn't exist
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Resume Items Table
CREATE TABLE IF NOT EXISTS public.resume_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT
);
