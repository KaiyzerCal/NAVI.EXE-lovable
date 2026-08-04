-- ── Admin users ───────────────────────────────────────────────────────────────
-- Source of truth for who gets full access without a subscription.
-- Add rows here for the owner and any team members.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin list; service role can do anything.
DROP POLICY IF EXISTS "Admins can read admin list" ON public.admin_users;
CREATE POLICY "Admins can read admin list"
  ON public.admin_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fast RPC used by edge functions (SECURITY DEFINER so no RLS bypass needed).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
  OR     EXISTS (SELECT 1 FROM public.user_roles  WHERE user_id = _user_id AND role = 'owner');
$$;

-- Insert the existing owner (already in user_roles) into admin_users too.
-- The ON CONFLICT clause makes this idempotent.
INSERT INTO public.admin_users (user_id, label)
VALUES ('7a76e35d-6aec-4db5-a8ff-e2d93de60d0d', 'Owner')
ON CONFLICT (user_id) DO NOTHING;

-- Give admins an elite subscription_tier so all frontend tier checks pass.
UPDATE public.profiles
SET subscription_tier = 'elite'
WHERE id IN (SELECT user_id FROM public.admin_users)
  AND (subscription_tier IS NULL OR subscription_tier = 'free');

-- ── Operator tier views (admin dashboard convenience) ─────────────────────────
CREATE OR REPLACE VIEW public.v_free_operators AS
  SELECT id, display_name, navi_name, created_at
  FROM public.profiles
  WHERE subscription_tier = 'free' OR subscription_tier IS NULL;

CREATE OR REPLACE VIEW public.v_core_operators AS
  SELECT id, display_name, navi_name, created_at
  FROM public.profiles
  WHERE subscription_tier = 'core';

CREATE OR REPLACE VIEW public.v_elite_operators AS
  SELECT id, display_name, navi_name, created_at
  FROM public.profiles
  WHERE subscription_tier = 'elite';

CREATE OR REPLACE VIEW public.v_admin_operators AS
  SELECT a.user_id AS id, p.display_name, p.navi_name, a.label, a.created_at
  FROM public.admin_users a
  JOIN public.profiles p ON p.id = a.user_id;

-- ── subscriptions table: add tier column if missing ───────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'core';
