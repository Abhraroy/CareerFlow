-- ============================================================
-- JOBFINDMATCH
-- USER TABLE MIGRATION
-- ============================================================
--
-- Purpose:
--   Creates the application's public user table.
--
-- Important:
--   DO NOT DROP auth.users.
--   auth.users is managed by Supabase Authentication.
--
-- Structure:
--
--   auth.users
--       │
--       └── public.users
--
--   public.users.id = auth.users.id
--
-- RLS:
--   A user can only read/update their own user record.
--
-- ============================================================


BEGIN;


-- ============================================================
-- 1. DROP EXISTING USER TABLE
-- ============================================================
--
-- We are rebuilding the application-level user table.
--
-- CASCADE is intentionally used here because this is being
-- migrated one table at a time. When we later create the
-- dependent tables, they will reference this table.
--
-- IMPORTANT:
--   This does NOT affect auth.users.
--
-- ============================================================

DROP TABLE IF EXISTS public.users CASCADE;


-- ============================================================
-- 2. CREATE USER TABLE
-- ============================================================

CREATE TABLE public.users (

    -- --------------------------------------------------------
    -- Primary key
    --
    -- This is intentionally the same UUID as auth.users.id.
    -- --------------------------------------------------------
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,


    -- --------------------------------------------------------
    -- User email
    --
    -- Authentication is still handled by Supabase Auth.
    -- This column is application-level user information.
    -- --------------------------------------------------------
    email TEXT,


    -- --------------------------------------------------------
    -- User's display/name
    -- --------------------------------------------------------
    name TEXT,


    -- --------------------------------------------------------
    -- Record creation timestamp
    -- --------------------------------------------------------
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- --------------------------------------------------------
    -- Last modification timestamp
    -- --------------------------------------------------------
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 3. COMMENTS
-- ============================================================
--
-- Database comments make the schema easier to understand
-- when inspecting it later in Supabase/PostgreSQL.
--
-- ============================================================

COMMENT ON TABLE public.users IS
'Application-level user profile table linked one-to-one with Supabase auth.users.';

COMMENT ON COLUMN public.users.id IS
'Primary key and foreign key to auth.users.id.';

COMMENT ON COLUMN public.users.email IS
'Application-level copy of the user email. Authentication is managed by Supabase Auth.';

COMMENT ON COLUMN public.users.name IS
'User display name.';

COMMENT ON COLUMN public.users.created_at IS
'Timestamp when the application user record was created.';

COMMENT ON COLUMN public.users.updated_at IS
'Timestamp when the application user record was last modified.';


-- ============================================================
-- 4. INDEXES
-- ============================================================

-- ------------------------------------------------------------
-- Email lookup index
--
-- Useful for:
--   Finding a user by email.
--
-- LOWER() makes the lookup case-insensitive.
--
-- Example:
--   USER@EMAIL.COM
--   user@email.com
--
-- are treated as the same value for the index.
-- ------------------------------------------------------------

CREATE UNIQUE INDEX users_email_unique_idx
ON public.users (LOWER(email))
WHERE email IS NOT NULL;


-- ------------------------------------------------------------
-- Name lookup index
--
-- Useful if the application later searches users by name.
--
-- This is intentionally NOT unique because multiple users
-- can have the same name.
-- ------------------------------------------------------------

CREATE INDEX users_name_idx
ON public.users (name);


-- ============================================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
--
-- Automatically updates updated_at whenever the row changes.
--
-- This prevents application code from having to manually
-- update updated_at on every UPDATE operation.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
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

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_users_updated_at();


-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================
--
-- RLS ensures that users cannot access another user's record
-- through the Supabase client.
--
-- ============================================================

ALTER TABLE public.users
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS POLICY - SELECT
-- ============================================================
--
-- A user can only read their own record.
--
-- auth.uid() returns the UUID of the currently authenticated
-- Supabase user.
--
-- ============================================================

CREATE POLICY "Users can view their own user record"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);


-- ============================================================
-- 9. RLS POLICY - INSERT
-- ============================================================
--
-- A user can only create a public user record whose ID matches
-- their authenticated Supabase user ID.
--
-- ============================================================

CREATE POLICY "Users can create their own user record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);


-- ============================================================
-- 10. RLS POLICY - UPDATE
-- ============================================================
--
-- Users can only update their own record.
--
-- Both USING and WITH CHECK are important:
--
-- USING:
--   Controls which existing row can be modified.
--
-- WITH CHECK:
--   Prevents the user from changing the row so that it belongs
--   to another user.
--
-- ============================================================

CREATE POLICY "Users can update their own user record"
ON public.users
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);


-- ============================================================
-- 11. RLS POLICY - DELETE
-- ============================================================
--
-- Users can delete their own application-level user record.
--
-- NOTE:
--   Because id references auth.users with ON DELETE CASCADE,
--   deleting the auth user will also remove this record.
--
-- Whether you actually want users to be able to delete their
-- own account should be decided at the application/API level.
--
-- ============================================================

CREATE POLICY "Users can delete their own user record"
ON public.users
FOR DELETE
TO authenticated
USING (
    id = auth.uid()
);


-- ============================================================
-- 12. FINISH
-- ============================================================

COMMIT;