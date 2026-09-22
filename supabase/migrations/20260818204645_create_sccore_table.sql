-- ============================================================
-- JOBFINDMATCH
-- SCORES TABLE MIGRATION
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
--          public.scores
--
--
-- Purpose:
--
--   Stores the compatibility/evaluation score between a
--   user's resume and a job.
--
--
-- Relationships:
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
-- 1. DROP EXISTING SCORES TABLE
-- ============================================================
--
-- WARNING:
-- This permanently removes the existing scores table and
-- its data.
--
-- Make sure existing data is backed up if required.
--
-- CASCADE removes dependent database objects.
--
-- ============================================================

DROP TABLE IF EXISTS public.scores CASCADE;


-- ============================================================
-- 2. CREATE SCORES TABLE
-- ============================================================

CREATE TABLE public.scores (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- Owner of this score
    --
    -- Used for RLS and user-level filtering.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Job being evaluated
    -- --------------------------------------------------------

    job_id UUID NOT NULL
        REFERENCES public.jobs(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Resume being evaluated against the job
    -- --------------------------------------------------------

    resume_id UUID NOT NULL
        REFERENCES public.resumes(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Resume-to-job fit score
    --
    -- Expected range:
    --   0 - 100
    --
    -- Example:
    --   87.5
    -- --------------------------------------------------------

    fit_score NUMERIC NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Potential score
    --
    -- Represents potential compatibility after considering
    -- improvements, missing skills, experience gaps, etc.
    --
    -- Expected range:
    --   0 - 100
    -- --------------------------------------------------------

    potential_score NUMERIC NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Record creation timestamp
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Record last modification timestamp
    -- --------------------------------------------------------

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- ========================================================
    -- VALIDATION
    -- ========================================================

    CONSTRAINT scores_fit_score_check
        CHECK (
            fit_score >= 0
            AND fit_score <= 100
        ),


    CONSTRAINT scores_potential_score_check
        CHECK (
            potential_score >= 0
            AND potential_score <= 100
        )

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.scores IS
'Stores resume-to-job compatibility and potential scores for a user.';


COMMENT ON COLUMN public.scores.id IS
'Unique identifier for the score record.';


COMMENT ON COLUMN public.scores.user_id IS
'ID of the user who owns this score. Used for row-level security.';


COMMENT ON COLUMN public.scores.job_id IS
'ID of the job being evaluated.';


COMMENT ON COLUMN public.scores.resume_id IS
'ID of the resume being evaluated against the job.';


COMMENT ON COLUMN public.scores.fit_score IS
'Current resume-to-job compatibility score from 0 to 100.';


COMMENT ON COLUMN public.scores.potential_score IS
'Estimated potential score from 0 to 100 after considering possible improvements.';


COMMENT ON COLUMN public.scores.created_at IS
'Timestamp when the score record was created.';


COMMENT ON COLUMN public.scores.updated_at IS
'Timestamp when the score record was last modified.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User ownership index
--
-- Important for RLS and retrieving all scores belonging
-- to the current user.
-- ------------------------------------------------------------

CREATE INDEX scores_user_id_idx
ON public.scores(user_id);


-- ------------------------------------------------------------
-- User + creation date
--
-- Useful for:
--
-- "Show my latest scoring results."
-- ------------------------------------------------------------

CREATE INDEX scores_user_created_at_idx
ON public.scores(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Job lookup
--
-- Useful for:
--
-- "Show scores for this job."
-- ------------------------------------------------------------

CREATE INDEX scores_job_id_idx
ON public.scores(job_id);


-- ------------------------------------------------------------
-- Resume lookup
--
-- Useful for:
--
-- "Show scores generated for this resume."
-- ------------------------------------------------------------

CREATE INDEX scores_resume_id_idx
ON public.scores(resume_id);


-- ------------------------------------------------------------
-- User + job
--
-- Useful for finding a user's scores for a specific job.
-- ------------------------------------------------------------

CREATE INDEX scores_user_job_idx
ON public.scores(
    user_id,
    job_id
);


-- ------------------------------------------------------------
-- User + resume
--
-- Useful for finding a user's scores for a specific resume.
-- ------------------------------------------------------------

CREATE INDEX scores_user_resume_idx
ON public.scores(
    user_id,
    resume_id
);


-- ============================================================
-- 5. UPDATED_AT FUNCTION
-- ============================================================
--
-- Automatically updates updated_at whenever a score changes.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_scores_updated_at()
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

CREATE TRIGGER scores_updated_at
BEFORE UPDATE ON public.scores
FOR EACH ROW
EXECUTE FUNCTION public.update_scores_updated_at();


-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.scores
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS - SELECT
-- ============================================================
--
-- Users can only see their own scores.
--
-- ============================================================

CREATE POLICY "Users can view their own scores"
ON public.scores
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 9. RLS - INSERT
-- ============================================================
--
-- Users can only create score records belonging to themselves.
-- ============================================================

CREATE POLICY "Users can create their own scores"
ON public.scores
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
--   User must own the existing score.
--
-- WITH CHECK:
--   Updated score must still belong to the same user.
--
-- ============================================================

CREATE POLICY "Users can update their own scores"
ON public.scores
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

CREATE POLICY "Users can delete their own scores"
ON public.scores
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 12. FINISH
-- ============================================================

COMMIT;