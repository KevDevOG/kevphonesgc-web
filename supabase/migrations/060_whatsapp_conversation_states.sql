-- ==========================================
-- 060_whatsapp_conversation_states.sql
-- ==========================================

BEGIN;

-- 1. Create table for minimal structured WhatsApp conversation state
CREATE TABLE public.whatsapp_conversation_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_key text UNIQUE NOT NULL CHECK (trim(sender_key) <> ''),
  conversation_state jsonb NOT NULL DEFAULT '{"flow":"none"}'::jsonb,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for expiration / activity queries
CREATE INDEX idx_whatsapp_conversation_states_last_activity_at
  ON public.whatsapp_conversation_states(last_activity_at);

-- 3. Automatic updated_at trigger
CREATE TRIGGER set_whatsapp_conversation_states_updated_at
  BEFORE UPDATE ON public.whatsapp_conversation_states
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS & Security (Internal server-only infrastructure)
ALTER TABLE public.whatsapp_conversation_states ENABLE ROW LEVEL SECURITY;

-- Revoke all access from standard/client roles (no public or client policies created)
REVOKE ALL ON TABLE public.whatsapp_conversation_states FROM PUBLIC;
REVOKE ALL ON TABLE public.whatsapp_conversation_states FROM anon;
REVOKE ALL ON TABLE public.whatsapp_conversation_states FROM authenticated;

-- Grant access exclusively to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_conversation_states TO service_role;

COMMIT;

