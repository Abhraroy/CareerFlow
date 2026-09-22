-- ============================================================
-- JOBFINDMATCH
-- RESUMES TABLE MIGRATION
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
--   public.resumes
--
-- Ownership:
--   resumes.user_id = users.id
--
-- RLS:
--   A user can only access resumes where
--   resumes.user_id = auth.uid()
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING RESUMES TABLE
-- ============================================================
--
-- CASCADE removes existing dependent objects such as old
-- foreign-key constraints/policies.
--
-- IMPORTANT:
--   This deletes the existing resumes table and its data.
--   Make sure the data has been backed up if it is required.
--
-- ============================================================

DROP TABLE IF EXISTS public.resumes CASCADE;


-- ============================================================
-- 2. CREATE RESUMES TABLE
-- ============================================================

CREATE TABLE public.resumes (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- Owner of the resume
    --
    -- References the application-level users table.
    --
    -- ON DELETE CASCADE:
    -- If the user is deleted, their resumes are deleted too.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- User-defined resume name
    --
    -- Example:
    --   "Software Engineer Resume"
    -- --------------------------------------------------------

    name TEXT NULL,


    -- --------------------------------------------------------
    -- Original uploaded file name
    --
    -- Example:
    --   "Abhra_Roy_Resume.pdf"
    -- --------------------------------------------------------

    file_name TEXT,


    -- --------------------------------------------------------
    -- File size in bytes
    --
    -- BIGINT is preferred over TEXT because this is numeric data.
    --
    -- Example:
    --   245760
    -- --------------------------------------------------------

    file_size BIGINT,


    -- --------------------------------------------------------
    -- Raw resume content
    --
    -- This should contain the extracted/raw resume data.
    --
    -- If this is the actual uploaded binary file, use
    -- Supabase Storage instead of storing the file here.
    -- --------------------------------------------------------

    raw_resume_data TEXT,


    -- --------------------------------------------------------
    -- Resume creation timestamp
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Resume last modification timestamp
    -- --------------------------------------------------------

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Structured resume representation
    --
    -- Example:
    --
    -- {
    --   "basics": {...},
    --   "experience": [...],
    --   "education": [...],
    --   "skills": [...]
    -- }
    --
    -- JSONB is used because PostgreSQL can efficiently query
    -- and index JSON data when needed.
    -- --------------------------------------------------------

    structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,


    -- --------------------------------------------------------
    -- Basic validation for file size.
    --
    -- NULL is allowed because the file size may not always be
    -- available.
    -- --------------------------------------------------------

    CONSTRAINT resumes_file_size_check
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.resumes IS
'User-owned resumes uploaded and managed by JobFindMatch.';


COMMENT ON COLUMN public.resumes.id IS
'Unique identifier for the resume.';


COMMENT ON COLUMN public.resumes.user_id IS
'ID of the user who owns this resume. References public.users.id.';


COMMENT ON COLUMN public.resumes.name IS
'User-defined display name for the resume.';


COMMENT ON COLUMN public.resumes.file_name IS
'Original name of the uploaded resume file.';


COMMENT ON COLUMN public.resumes.file_size IS
'Size of the uploaded resume file in bytes.';


COMMENT ON COLUMN public.resumes.raw_resume_data IS
'Raw or extracted textual resume content. Binary files should be stored in Supabase Storage.';


COMMENT ON COLUMN public.resumes.created_at IS
'Timestamp when the resume record was created.';


COMMENT ON COLUMN public.resumes.updated_at IS
'Timestamp when the resume record was last modified.';


COMMENT ON COLUMN public.resumes.structured_data IS
'Structured JSON representation of the resume content.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User ownership index
--
-- Important for:
--
-- SELECT *
-- FROM resumes
-- WHERE user_id = auth.uid();
--
-- Also helps RLS filtering.
-- ------------------------------------------------------------

CREATE INDEX resumes_user_id_idx
ON public.resumes(user_id);


-- ------------------------------------------------------------
-- User + creation date index
--
-- Useful for the resume dashboard:
--
-- "Give me my resumes, newest first."
--
-- ------------------------------------------------------------

CREATE INDEX resumes_user_created_at_idx
ON public.resumes(
    user_id,
    created_at DESC
);


-- ============================================================
-- 5. UPDATED_AT FUNCTION
-- ============================================================
--
-- The function updates updated_at automatically whenever a
-- resume is modified.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_resumes_updated_at()
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

CREATE TRIGGER resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_resumes_updated_at();


-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.resumes
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS - SELECT
-- ============================================================
--
-- Users can only read their own resumes.
--
-- auth.uid() = currently authenticated user's ID.
--
-- ============================================================

CREATE POLICY "Users can view their own resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 9. RLS - INSERT
-- ============================================================
--
-- Prevents a user from creating a resume belonging to another
-- user.
--
-- Even if someone modifies the user_id in the client request,
-- PostgreSQL will reject it.
--
-- ============================================================

CREATE POLICY "Users can create their own resumes"
ON public.resumes
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
--   Determines which existing rows the user can update.
--
-- WITH CHECK:
--   Ensures the updated row still belongs to the same user.
--
-- This prevents:
--
--   User A
--      ↓
--   changes user_id
--      ↓
--   User B
--
-- ============================================================

CREATE POLICY "Users can update their own resumes"
ON public.resumes
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
-- Users can delete only their own resumes.
--
-- ============================================================

CREATE POLICY "Users can delete their own resumes"
ON public.resumes
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 12. FINISH
-- ============================================================

COMMIT;