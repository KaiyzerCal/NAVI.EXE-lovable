-- ============================================================================
-- Admin & security hardening
--
-- Fixes:
--  1. reported_content was readable/updatable by ANY authenticated user
--     (privilege escalation). Lock to owner-role only; the admin edge function
--     uses the service role and bypasses RLS for legitimate moderation.
--  2. beta_feedback: ensure only owners can read all rows.
--  3. Provide SECURITY DEFINER RPCs so the admin panel never needs broad
--     client-side table grants.
-- ============================================================================

-- ── reported_content: restrict to owners ────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated read reported_content"   ON public.reported_content;
DROP POLICY IF EXISTS "Authenticated update reported_content" ON public.reported_content;
DROP POLICY IF EXISTS "Owners read reported_content"          ON public.reported_content;
DROP POLICY IF EXISTS "Owners update reported_content"        ON public.reported_content;

CREATE POLICY "Owners read reported_content"
  ON public.reported_content FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners update reported_content"
  ON public.reported_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ── beta_feedback: owners may read all; users keep reading their own ─────────
DROP POLICY IF EXISTS "Owners read all feedback" ON public.beta_feedback;
CREATE POLICY "Owners read all feedback"
  ON public.beta_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ── Admin RPCs (SECURITY DEFINER, owner-gated) ──────────────────────────────
-- Every function re-checks has_role() so being able to EXECUTE is not enough.

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  subscription_tier text,
  beta_tester boolean,
  operator_level integer,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT p.id, p.display_name, p.subscription_tier, p.beta_tester,
           p.operator_level, p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_beta(_user_id uuid, _value boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET beta_tester = _value WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_report(_id uuid, _action text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.reported_content
     SET reviewed = true, action_taken = _action
   WHERE id = _id;
END;
$$;

-- Only authenticated users may call them; the body enforces the owner check.
REVOKE ALL ON FUNCTION public.admin_list_users()                     FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_toggle_beta(uuid, boolean)       FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_review_report(uuid, text)        FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_beta(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_report(uuid, text)  TO authenticated;
