-- ============================================================
-- ALTER APPLICATIONS TABLE MIGRATION
-- Adds status, notes, applied_at, and updated_at columns
-- ============================================================

BEGIN;

-- 1. Add status column with allowed pipeline stage constraints
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'applied'
CHECK (status IN ('applied', 'shortlisted', 'interviewing', 'offer', 'rejected'));

-- 2. Add notes column for user notes and interview tracking
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 3. Add applied_at timestamp column
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Add updated_at timestamp column
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Create index on status & user_id for high-performance dashboard filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_status 
ON public.applications (user_id, status);

COMMIT;
