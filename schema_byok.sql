-- ============================================================
-- BYOK (Bring Your Own Key) — API Usage Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. OpenAI Keys Table
--    One active key per user. Key is encrypted (AES-256-GCM via Electron safeStorage)
--    and stored as a base64 string. The plaintext key is NEVER stored.
CREATE TABLE IF NOT EXISTS public.openai_keys (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_key TEXT      NOT NULL,       -- base64-encoded AES-256-GCM ciphertext
    key_last4   TEXT,                       -- last 4 chars of the original key for display
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one key record per user (we replace, not accumulate)
CREATE UNIQUE INDEX IF NOT EXISTS uq_openai_keys_user_id ON public.openai_keys(user_id);

-- 2. AI Usages Table
--    One row per OpenAI API call.  Cascades on key deletion.
CREATE TABLE IF NOT EXISTS public.ai_usages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    openai_key_id   UUID        NOT NULL REFERENCES public.openai_keys(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature         TEXT        NOT NULL,   -- AIFeature enum value
    model           TEXT        NOT NULL,
    input_tokens    INT         NOT NULL DEFAULT 0,
    output_tokens   INT         NOT NULL DEFAULT 0,
    total_tokens    INT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_openai_keys_user_id      ON public.openai_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usages_openai_key_id  ON public.ai_usages(openai_key_id);
CREATE INDEX IF NOT EXISTS idx_ai_usages_user_id        ON public.ai_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usages_created_at     ON public.ai_usages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usages_feature        ON public.ai_usages(feature);

-- 5. Auto-update updated_at on openai_keys
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER openai_keys_set_updated_at
    BEFORE UPDATE ON public.openai_keys
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
