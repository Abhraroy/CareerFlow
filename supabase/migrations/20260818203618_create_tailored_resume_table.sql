-- ============================================================
-- JOBFINDMATCH
-- TAILORED RESUMES TABLE MIGRATION
-- ============================================================
--
-- Relationship:
--
--   auth.users
--       │
--       ▼
--   public.users
--       │
--       ├───────────────┐
--       ▼               ▼
--   public.resumes   public.jobs
--       │               │
--       └───────┬───────┘
--               ▼
--      public.tailored_resumes
--
--
-- Ownership:
--
--   tailored_resumes.user_id
--          ↓
--   public.users.id
--
--
-- Foreign keys:
--
--   user_id   → users.id
--   resume_id → resumes.id
--   job_id    → jobs.id
--
--
-- RLS:
--
--   user_id = auth.uid()
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING TAILORED RESUMES TABLE
-- ============================================================
--
-- WARNING:
-- This permanently removes the existing tailored_resumes
-- table and its data.
--
-- CASCADE also removes objects depending on this table.
--
-- ============================================================

DROP TABLE IF EXISTS public.tailored_resumes CASCADE;


-- ============================================================
-- 2. CREATE TAILORED RESUMES TABLE
-- ============================================================

CREATE TABLE public.tailored_resumes (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- Owner of the tailored resume
    --
    -- Used directly by RLS.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Display name
    --
    -- Example:
    -- "Software Engineer - Google"
    -- --------------------------------------------------------

    name TEXT NOT NULL,


    -- --------------------------------------------------------
    -- Base resume used for tailoring
    --
    -- References the original resume.
    -- --------------------------------------------------------

    resume_id UUID NOT NULL
        REFERENCES public.resumes(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Target job used for tailoring
    --
    -- References the job for which the resume was tailored.
    -- --------------------------------------------------------

    job_id UUID NOT NULL
        REFERENCES public.jobs(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Raw generated tailored resume data
    -- --------------------------------------------------------

    raw_tailored_resume_data TEXT,


    -- --------------------------------------------------------
    -- Information describing what the tailoring was based on.
    --
    -- JSONB allows you to store structured metadata.
    --
    -- Example:
    --
    -- {
    --   "source": "job_description",
    --   "skills": ["React", "TypeScript"],
    --   "experience": true
    -- }
    -- --------------------------------------------------------

    tailored_based_on JSONB NOT NULL DEFAULT '{}'::jsonb,


    -- --------------------------------------------------------
    -- Structured representation of the tailored resume.
    --
    -- Example:
    --
    -- {
    --   "basics": {...},
    --   "experience": [...],
    --   "education": [...],
    --   "skills": [...]
    -- }
    -- --------------------------------------------------------

    structured_output JSONB NOT NULL DEFAULT '{}'::jsonb,


    -- --------------------------------------------------------
    -- Overall fit score.
    --
    -- Expected range:
    -- 0 - 100
    --
    -- DEFAULT 0 means a newly-created tailored resume starts
    -- without a calculated score.
    -- --------------------------------------------------------

    fit_score NUMERIC NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Record creation timestamp
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Record last modification timestamp
    -- --------------------------------------------------------

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Fit score validation
    -- --------------------------------------------------------

    CONSTRAINT tailored_resumes_fit_score_check
        CHECK (
            fit_score >= 0
            AND fit_score <= 100
        )

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.tailored_resumes IS
'User-owned resumes generated by tailoring a base resume against a specific job.';


COMMENT ON COLUMN public.tailored_resumes.id IS
'Unique identifier for the tailored resume.';


COMMENT ON COLUMN public.tailored_resumes.user_id IS
'ID of the user who owns this tailored resume. References public.users.id and is used for RLS.';


COMMENT ON COLUMN public.tailored_resumes.name IS
'Display name of the tailored resume.';


COMMENT ON COLUMN public.tailored_resumes.resume_id IS
'ID of the original/base resume used to generate this tailored resume.';


COMMENT ON COLUMN public.tailored_resumes.job_id IS
'ID of the job for which this resume was tailored.';


COMMENT ON COLUMN public.tailored_resumes.raw_tailored_resume_data IS
'Raw textual representation of the generated tailored resume.';


COMMENT ON COLUMN public.tailored_resumes.tailored_based_on IS
'Structured metadata describing the information and criteria used to tailor the resume.';


COMMENT ON COLUMN public.tailored_resumes.structured_output IS
'Structured JSON representation of the tailored resume.';


COMMENT ON COLUMN public.tailored_resumes.fit_score IS
'Overall resume-to-job fit score from 0 to 100.';


COMMENT ON COLUMN public.tailored_resumes.created_at IS
'Timestamp when the tailored resume was created.';


COMMENT ON COLUMN public.tailored_resumes.updated_at IS
'Timestamp when the tailored resume was last modified.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User ownership index
--
-- Important for:
--   RLS
--   User dashboard queries
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_user_id_idx
ON public.tailored_resumes(user_id);


-- ------------------------------------------------------------
-- User + creation date
--
-- Useful for:
-- "Show my tailored resumes, newest first."
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_user_created_at_idx
ON public.tailored_resumes(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Resume lookup
--
-- Useful for:
-- "Show all tailored resumes created from this base resume."
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_resume_id_idx
ON public.tailored_resumes(resume_id);


-- ------------------------------------------------------------
-- Job lookup
--
-- Useful for:
-- "Show all tailored resumes created for this job."
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_job_id_idx
ON public.tailored_resumes(job_id);


-- ------------------------------------------------------------
-- User + job
--
-- Useful when looking up tailored resumes for a specific
-- user's job.
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_user_job_idx
ON public.tailored_resumes(
    user_id,
    job_id
);


-- ------------------------------------------------------------
-- User + resume
--
-- Useful when looking up tailored resumes generated from
-- a specific user's base resume.
-- ------------------------------------------------------------

CREATE INDEX tailored_resumes_user_resume_idx
ON public.tailored_resumes(
    user_id,
    resume_id
);


-- ============================================================
-- 5. UPDATED_AT FUNCTION
-- ============================================================
--
-- Automatically updates updated_at whenever a tailored
-- resume is modified.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tailored_resumes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;
$$;


-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER tailored_resumes_updated_at
BEFORE UPDATE ON public.tailored_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_tailored_resumes_updated_at();


-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tailored_resumes
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS - SELECT
-- ============================================================
--
-- Users can only read their own tailored resumes.
--
-- ============================================================

CREATE POLICY "Users can view their own tailored resumes"
ON public.tailored_resumes
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 9. RLS - INSERT
-- ============================================================
--
-- Users can only create a tailored resume belonging to
-- themselves.
--
-- ============================================================

CREATE POLICY "Users can create their own tailored resumes"
ON public.tailored_resumes
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================
-- 10. RLS - UPDATE
-- ============================================================
--
-- USING:
--   User must own the existing row.
--
-- WITH CHECK:
--   Updated row must still belong to the same user.
--
-- ============================================================

CREATE POLICY "Users can update their own tailored resumes"
ON public.tailored_resumes
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================
-- 11. RLS - DELETE
-- ============================================================

CREATE POLICY "Users can delete their own tailored resumes"
ON public.tailored_resumes
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 12. FINISH
-- ============================================================

COMMIT;