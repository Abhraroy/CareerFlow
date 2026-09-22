-- ============================================================
-- JOBFINDMATCH
-- APPLICATIONS TABLE MIGRATION
-- ============================================================
--
-- Purpose:
--
--   Stores a user's job application and tracks which resume
--   was used when applying.
--
--
-- Relationship:
--
--   auth.users
--       │
--       ▼
--   public.users
--       │
--       ▼
--   public.applications
--       │
--       ├── job_id
--       ├── resume_id
--       └── tailored_resume_id
--
--
-- Resume usage:
--
--   resume_id          → NULLABLE
--   tailored_resume_id → NULLABLE
--
-- At least ONE of the two must be provided.
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING APPLICATIONS TABLE
-- ============================================================
--
-- WARNING:
-- This permanently removes the existing applications table
-- and its data.
--
-- ============================================================

DROP TABLE IF EXISTS public.applications CASCADE;


-- ============================================================
-- 2. CREATE APPLICATIONS TABLE
-- ============================================================

CREATE TABLE public.applications (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- User who submitted the application
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Job being applied to
    -- --------------------------------------------------------

    job_id UUID NOT NULL
        REFERENCES public.jobs(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Base resume used for the application
    --
    -- NULL is allowed when the user applied using only a
    -- tailored resume.
    -- --------------------------------------------------------

    resume_id UUID
        REFERENCES public.resumes(id)
        ON DELETE SET NULL,


    -- --------------------------------------------------------
    -- Tailored resume used for the application
    --
    -- NULL is allowed when the user applied using their
    -- original/base resume.
    -- --------------------------------------------------------

    tailored_resume_id UUID
        REFERENCES public.tailored_resumes(id)
        ON DELETE SET NULL,


    -- --------------------------------------------------------
    -- Whether the application/job has been shortlisted
    -- --------------------------------------------------------

    shortlisted BOOLEAN NOT NULL DEFAULT FALSE,


    -- --------------------------------------------------------
    -- Application creation timestamp
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- ========================================================
    -- VALIDATION
    -- ========================================================
    --
    -- At least one resume must be associated with an
    -- application.
    --
    -- Valid:
    --
    --   resume_id = R1
    --   tailored_resume_id = NULL
    --
    -- OR:
    --
    --   resume_id = NULL
    --   tailored_resume_id = T1
    --
    -- OR:
    --
    --   resume_id = R1
    --   tailored_resume_id = T1
    --
    -- Invalid:
    --
    --   resume_id = NULL
    --   tailored_resume_id = NULL
    --
    -- ========================================================

    CONSTRAINT applications_resume_required_check
        CHECK (
            resume_id IS NOT NULL
            OR tailored_resume_id IS NOT NULL
        )

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.applications IS
'Stores job applications submitted by users and the resume used for each application.';


COMMENT ON COLUMN public.applications.id IS
'Unique identifier for the application.';


COMMENT ON COLUMN public.applications.user_id IS
'ID of the user who submitted the application.';


COMMENT ON COLUMN public.applications.job_id IS
'ID of the job associated with the application.';


COMMENT ON COLUMN public.applications.resume_id IS
'ID of the base resume used for the application. Nullable when only a tailored resume is used.';


COMMENT ON COLUMN public.applications.tailored_resume_id IS
'ID of the tailored resume used for the application. Nullable when only a base resume is used.';


COMMENT ON COLUMN public.applications.shortlisted IS
'Indicates whether the application has been shortlisted.';


COMMENT ON COLUMN public.applications.created_at IS
'Timestamp when the application record was created.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User lookup
--
-- Useful for:
--   "Show all applications for the current user."
--
-- ------------------------------------------------------------

CREATE INDEX applications_user_id_idx
ON public.applications(user_id);


-- ------------------------------------------------------------
-- User + creation date
--
-- Useful for:
--   "Show my latest applications."
--
-- ------------------------------------------------------------

CREATE INDEX applications_user_created_at_idx
ON public.applications(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Job lookup
--
-- Useful for:
--   "Show applications for this job."
--
-- ------------------------------------------------------------

CREATE INDEX applications_job_id_idx
ON public.applications(job_id);


-- ------------------------------------------------------------
-- Resume lookup
--
-- Useful for finding applications where a particular
-- base resume was used.
-- ------------------------------------------------------------

CREATE INDEX applications_resume_id_idx
ON public.applications(resume_id)
WHERE resume_id IS NOT NULL;


-- ------------------------------------------------------------
-- Tailored resume lookup
--
-- Useful for finding applications where a particular
-- tailored resume was used.
-- ------------------------------------------------------------

CREATE INDEX applications_tailored_resume_id_idx
ON public.applications(tailored_resume_id)
WHERE tailored_resume_id IS NOT NULL;


-- ------------------------------------------------------------
-- Shortlisted applications
--
-- Partial index because most applications may not be
-- shortlisted.
-- ------------------------------------------------------------

CREATE INDEX applications_shortlisted_idx
ON public.applications(user_id, created_at DESC)
WHERE shortlisted = TRUE;


-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.applications
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS - SELECT
-- ============================================================
--
-- Users can only see their own applications.
--
-- ============================================================

CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 7. RLS - INSERT
-- ============================================================
--
-- Users can only create applications belonging to themselves.
--
-- ============================================================

CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================
-- 8. RLS - UPDATE
-- ============================================================
--
-- Users can update their own applications.
--
-- ============================================================

CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================
-- 9. RLS - DELETE
-- ============================================================

CREATE POLICY "Users can delete their own applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 10. FINISH
-- ============================================================

COMMIT;