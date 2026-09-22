-- ============================================================
-- JOBFINDMATCH
-- API KEY TABLE MIGRATION
-- ============================================================
--
-- Purpose:
--
--   Stores information about API key usage associated with
--   JobFindMatch users.
--
-- Structure:
--
--   auth.users
--       │
--       ▼
--   public.users
--       │
--       ▼
--   public.apikeytable
--
--
-- Ownership:
--
--   apikeytable.user_id → users.id
--
--
-- RLS:
--
--   user_id = auth.uid()
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING API KEY TABLE
-- ============================================================
--
-- WARNING:
-- This permanently removes the existing apikeytable and
-- its data.
--
-- Make sure existing data is backed up if required.
--
-- ============================================================

DROP TABLE IF EXISTS public.apikeytable CASCADE;


-- ============================================================
-- 2. CREATE API KEY TABLE
-- ============================================================

CREATE TABLE public.apikeytable (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- User who owns/uses the API key
    --
    -- References the application-level users table.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- Type of API/AI operation
    --
    -- Examples:
    --
    --   resume_tailoring
    --   resume_analysis
    --   job_analysis
    --   job_matching
    --   embedding
    --
    -- --------------------------------------------------------

    type TEXT NOT NULL,


    -- --------------------------------------------------------
    -- Hashed API key
    --
    -- Stores only a non-reversible hash/fingerprint.
    --
    -- NEVER store the raw API key here.
    -- --------------------------------------------------------

    hashed_api_key TEXT,


    -- --------------------------------------------------------
    -- Timestamp when the API key usage was recorded
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.apikeytable IS
'Stores API key usage records associated with JobFindMatch users.';


COMMENT ON COLUMN public.apikeytable.id IS
'Unique identifier for the API key usage record.';


COMMENT ON COLUMN public.apikeytable.user_id IS
'ID of the user associated with the API key usage record. References public.users.id.';


COMMENT ON COLUMN public.apikeytable.type IS
'Type of AI/API operation associated with this API key usage record.';


COMMENT ON COLUMN public.apikeytable.hashed_api_key IS
'Non-reversible hash or fingerprint of the API key. Raw API keys must never be stored here.';


COMMENT ON COLUMN public.apikeytable.created_at IS
'Timestamp when the API key usage record was created.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User lookup
--
-- Useful for retrieving API key records belonging to a user.
-- Also helps RLS filtering.
-- ------------------------------------------------------------

CREATE INDEX apikeytable_user_id_idx
ON public.apikeytable(user_id);


-- ------------------------------------------------------------
-- User + creation time
--
-- Useful for retrieving recent API key usage for a user.
-- ------------------------------------------------------------

CREATE INDEX apikeytable_user_created_at_idx
ON public.apikeytable(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Type lookup
--
-- Useful for filtering usage by operation type.
-- ------------------------------------------------------------

CREATE INDEX apikeytable_type_idx
ON public.apikeytable(type);


-- ------------------------------------------------------------
-- Hashed API key lookup
--
-- Allows finding records associated with a particular
-- hashed API key without storing the original key.
-- ------------------------------------------------------------

CREATE INDEX apikeytable_hashed_api_key_idx
ON public.apikeytable(hashed_api_key)
WHERE hashed_api_key IS NOT NULL;


-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.apikeytable
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS - SELECT
-- ============================================================
--
-- Users can only view their own API key records.
--
-- ============================================================

CREATE POLICY "Users can view their own API key records"
ON public.apikeytable
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 7. RLS - INSERT
-- ============================================================
--
-- Users can only create API key records belonging to
-- themselves.
--
-- For production, API key usage records should preferably
-- be created by trusted server-side code rather than directly
-- from the browser.
--
-- ============================================================

CREATE POLICY "Users can create their own API key records"
ON public.apikeytable
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================
-- 8. RLS - UPDATE
-- ============================================================
--
-- API usage records should normally be immutable.
--
-- Therefore, no UPDATE policy is created.
--
-- Trusted server-side code can perform administrative
-- corrections when required.
--
-- ============================================================


-- ============================================================
-- 9. RLS - DELETE
-- ============================================================
--
-- API usage records should normally be retained for auditing
-- and usage tracking.
--
-- Therefore, no DELETE policy is created.
--
-- ============================================================


-- ============================================================
-- 10. FINISH
-- ============================================================

COMMIT;