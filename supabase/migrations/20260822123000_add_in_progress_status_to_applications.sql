-- ============================================================
-- ADD IN_PROGRESS STATUS TO APPLICATIONS TABLE MIGRATION
-- ============================================================

BEGIN;

-- Drop existing status check constraints if any exist
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;

-- Re-add check constraint to include 'in_progress' status
ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('in_progress', 'applied', 'shortlisted', 'interviewing', 'offer', 'rejected'));

COMMIT;
