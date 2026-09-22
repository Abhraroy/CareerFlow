-- ============================================================
-- JOBFINDMATCH
-- AI USAGES TABLE MIGRATION
-- ============================================================
--
-- Purpose:
--
--   Stores AI usage information associated with a user's
--   API key.
--
--
-- Relationship:
--
--   public.users
--       │
--       ▼
--   public.apikeytable
--       │
--       │ api_key_id
--       ▼
--   public.ai_usages
--
--
-- Ownership:
--
--   ai_usages.user_id
--       → public.users.id
--
--   ai_usages.api_key_id
--       → public.apikeytable.id
--
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING AI USAGES TABLE
-- ============================================================
--
-- WARNING:
-- This permanently removes the existing ai_usages table
-- and its data.
--
-- Make sure existing data is backed up if required.
--
-- ============================================================

DROP TABLE IF EXISTS public.ai_usages CASCADE;


-- ============================================================
-- 2. CREATE AI USAGES TABLE
-- ============================================================

CREATE TABLE public.ai_usages (

    -- --------------------------------------------------------
    -- Primary key
    -- --------------------------------------------------------

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- --------------------------------------------------------
    -- User who performed the AI operation
    --
    -- Used for ownership and RLS.
    -- --------------------------------------------------------

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- API key used for this AI operation
    --
    -- References the API key record stored in apikeytable.
    -- --------------------------------------------------------

    api_key_id UUID NOT NULL
        REFERENCES public.apikeytable(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- AI feature that was used
    --
    -- Examples:
    --
    --   resume_tailoring
    --   resume_analysis
    --   job_analysis
    --   job_matching
    --   resume_parsing
    --   embedding
    -- --------------------------------------------------------

    feature TEXT NOT NULL,


    -- --------------------------------------------------------
    -- AI model used
    --
    -- Examples:
    --
    --   gpt-4.1
    --   gpt-4o
    --   gpt-5
    --
    -- --------------------------------------------------------

    model TEXT NOT NULL,


    -- --------------------------------------------------------
    -- Number of input tokens
    -- --------------------------------------------------------

    input_tokens INTEGER NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Number of output tokens
    -- --------------------------------------------------------

    output_tokens INTEGER NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Total tokens used
    --
    -- Normally:
    --
    -- input_tokens + output_tokens
    --
    -- --------------------------------------------------------

    total_tokens INTEGER NOT NULL DEFAULT 0,


    -- --------------------------------------------------------
    -- Timestamp when the AI operation occurred
    -- --------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- ========================================================
    -- TOKEN VALIDATION
    -- ========================================================

    CONSTRAINT ai_usages_input_tokens_check
        CHECK (input_tokens >= 0),

    CONSTRAINT ai_usages_output_tokens_check
        CHECK (output_tokens >= 0),

    CONSTRAINT ai_usages_total_tokens_check
        CHECK (total_tokens >= 0)

);


-- ============================================================
-- 3. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.ai_usages IS
'Stores AI model usage and token consumption associated with a user and API key.';


COMMENT ON COLUMN public.ai_usages.id IS
'Unique identifier for the AI usage record.';


COMMENT ON COLUMN public.ai_usages.user_id IS
'ID of the user who performed the AI operation. References public.users.id.';


COMMENT ON COLUMN public.ai_usages.api_key_id IS
'ID of the API key used for the AI operation. References public.apikeytable.id.';


COMMENT ON COLUMN public.ai_usages.feature IS
'Application feature that triggered the AI request.';


COMMENT ON COLUMN public.ai_usages.model IS
'AI model used for the request.';


COMMENT ON COLUMN public.ai_usages.input_tokens IS
'Number of tokens sent to the AI model.';


COMMENT ON COLUMN public.ai_usages.output_tokens IS
'Number of tokens generated by the AI model.';


COMMENT ON COLUMN public.ai_usages.total_tokens IS
'Total number of tokens consumed by the AI request.';


COMMENT ON COLUMN public.ai_usages.created_at IS
'Timestamp when the AI request occurred.';


-- ============================================================
-- 4. INDEXES
-- ============================================================


-- ------------------------------------------------------------
-- User lookup
--
-- Useful for:
--
--   SELECT *
--   FROM ai_usages
--   WHERE user_id = auth.uid();
--
-- ------------------------------------------------------------

CREATE INDEX ai_usages_user_id_idx
ON public.ai_usages(user_id);


-- ------------------------------------------------------------
-- API key lookup
--
-- Useful for:
--
--   "Show all AI usage generated using this API key."
--
-- ------------------------------------------------------------

CREATE INDEX ai_usages_api_key_id_idx
ON public.ai_usages(api_key_id);


-- ------------------------------------------------------------
-- User + creation date
--
-- Useful for:
--
--   "Show my latest AI usage."
--
-- ------------------------------------------------------------

CREATE INDEX ai_usages_user_created_at_idx
ON public.ai_usages(
    user_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- API key + creation date
--
-- Useful for:
--
--   "Show recent usage for this API key."
--
-- ------------------------------------------------------------

CREATE INDEX ai_usages_api_key_created_at_idx
ON public.ai_usages(
    api_key_id,
    created_at DESC
);


-- ------------------------------------------------------------
-- Feature lookup
--
-- Useful for:
--
--   "How much AI usage came from resume tailoring?"
--
-- ------------------------------------------------------------

CREATE INDEX ai_usages_feature_idx
ON public.ai_usages(feature);


-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ai_usages
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS - SELECT
-- ============================================================
--
-- Users can only view their own AI usage.
--
-- ============================================================

CREATE POLICY "Users can view their own AI usage"
ON public.ai_usages
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================
-- 7. RLS - INSERT
-- ============================================================
--
-- IMPORTANT:
--
-- AI usage records should ideally be created by trusted
-- server-side code.
--
-- This policy allows an authenticated user to insert a record
-- only for themselves.
--
-- The API key itself must also belong to the same user.
--
-- ============================================================

CREATE POLICY "Users can create their own AI usage"
ON public.ai_usages
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.apikeytable a
        WHERE a.id = api_key_id
        AND a.user_id = auth.uid()
    )
);


-- ============================================================
-- 8. NO UPDATE POLICY
-- ============================================================
--
-- AI usage records should normally be immutable.
--
-- Therefore, users cannot update usage records.
--
-- Trusted server-side code can perform administrative
-- corrections when necessary.
--
-- ============================================================


-- ============================================================
-- 9. NO DELETE POLICY
-- ============================================================
--
-- Usage records should normally be retained for auditing,
-- analytics, quotas, and billing.
--
-- Therefore, users cannot delete usage records.
--
-- ============================================================


-- ============================================================
-- 10. FINISH
-- ============================================================

COMMIT;