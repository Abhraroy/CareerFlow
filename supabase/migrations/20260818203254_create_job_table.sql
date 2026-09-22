-- ============================================================
-- JOBFINDMATCH
-- JOBS TABLE MIGRATION
-- ============================================================
--
-- Relationship:
--
--   auth.users
--       │
--       ▼
--   public.users
--       │
--       ▼
--   public.jobs
--
-- Ownership:
--   jobs.user_id = users.id
--
-- RLS:
--   A user can only access jobs where
--   jobs.user_id = auth.uid()
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING JOBS TABLE
-- ============================================================
--
-- WARNING:
--   This permanently removes the existing public.jobs table
--   and its data.
--
--   CASCADE also removes dependent foreign-key constraints,
--   policies, and other dependent database objects.
--
--   Make sure existing job data is backed up if required.
--
-- ============================================================

DROP TABLE IF EXISTS public.jobs CASCADE;


-- ============================================================
-- 2. CREATE JOBS TABLE
-- ============================================================

CREATE TABLE public.jobs (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- Owner of the job
    --
    -- References the application-level users table.
    --
    -- ON DELETE CASCADE:
    -- If the user is deleted, their saved jobs are deleted.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Company name
    -- --------------------------------------------------------

    company_name TEXT,


    -- --------------------------------------------------------
    -- Job title
    --
    -- Example:
    --   "Senior Frontend Engineer"
    -- --------------------------------------------------------

    job_title TEXT NOT NULL,


    -- --------------------------------------------------------
    -- Full job description
    -- --------------------------------------------------------

    job_description TEXT,


    -- --------------------------------------------------------
    -- Original job posting URL
    --
    -- Example:
    --   https://www.linkedin.com/jobs/view/...
    -- --------------------------------------------------------

    job_link TEXT,


    -- --------------------------------------------------------
    -- Company logo URL
    -- --------------------------------------------------------

    logo TEXT,


    -- --------------------------------------------------------
    -- Company description
    -- --------------------------------------------------------

    company_description TEXT,


    -- --------------------------------------------------------
    -- Job creation timestamp
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Job last modification timestamp
    -- --------------------------------------------------------

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.jobs IS
'User-owned job postings saved and analyzed by JobFindMatch.';


COMMENT ON COLUMN public.jobs.id IS
'Unique identifier for the saved job.';


COMMENT ON COLUMN public.jobs.user_id IS
'ID of the user who owns this job. References public.users.id.';


COMMENT ON COLUMN public.jobs.company_name IS
'Name of the company offering the job.';


COMMENT ON COLUMN public.jobs.job_title IS
'Title of the job position.';


COMMENT ON COLUMN public.jobs.job_description IS
'Full job description or extracted job posting content.';


COMMENT ON COLUMN public.jobs.job_link IS
'Original URL of the job posting.';


COMMENT ON COLUMN public.jobs.logo IS
'URL or reference to the company logo.';


COMMENT ON COLUMN public.jobs.company_description IS
'Description of the company associated with the job.';


COMMENT ON COLUMN public.jobs.created_at IS
'Timestamp when the job record was created.';


COMMENT ON COLUMN public.jobs.updated_at IS
'Timestamp when the job record was last modified.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User ownership index
--
-- Important for:
--
-- SELECT *
-- FROM jobs
-- WHERE user_id = auth.uid();
--
-- Also helps RLS filtering.
-- ------------------------------------------------------------

CREATE INDEX jobs_user_id_idx
ON public.jobs(user_id);


-- ------------------------------------------------------------
-- User + creation date index
--
-- Useful for:
--
-- "Show my recently saved jobs."
--
-- ------------------------------------------------------------

CREATE INDEX jobs_user_created_at_idx
ON public.jobs(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Company lookup index
--
-- Useful when filtering/searching jobs by company.
-- ------------------------------------------------------------

CREATE INDEX jobs_company_name_idx
ON public.jobs(company_name);


-- ------------------------------------------------------------
-- Optional job title lookup index
--
-- Useful for exact/prefix-style queries.
--
-- Full-text search should use a dedicated search strategy
-- later if required.
-- ------------------------------------------------------------

CREATE INDEX jobs_job_title_idx
ON public.jobs(job_title);


-- ============================================================
-- 5. UPDATED_AT FUNCTION
-- ============================================================
--
-- Automatically updates updated_at whenever a job is changed.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
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

CREATE TRIGGER jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_jobs_updated_at();


-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.jobs
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS - SELECT
-- ============================================================
--
-- Users can only see their own saved jobs.
--
-- ============================================================

CREATE POLICY "Users can view their own jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 9. RLS - INSERT
-- ============================================================
--
-- Prevents a user from creating a job under another user's ID.
--
-- ============================================================

CREATE POLICY "Users can create their own jobs"
ON public.jobs
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
--   User must own the existing job.
--
-- WITH CHECK:
--   Updated job must still belong to the same user.
--
-- ============================================================

CREATE POLICY "Users can update their own jobs"
ON public.jobs
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
--
-- Users can only delete jobs they own.
--
-- ============================================================

CREATE POLICY "Users can delete their own jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 12. FINISH
-- ============================================================

COMMIT;