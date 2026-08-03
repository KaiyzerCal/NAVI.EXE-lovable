-- ============================================================
-- SECURITY FIX — privilege escalation via profiles self-update
-- ============================================================
-- Found via live testing: a freshly-signed-up, unpaid test account
-- successfully set its own subscription_tier to 'core' with a single
-- authenticated PATCH request. profiles' self-update RLS policy
-- (auth.uid() = id) has no column restriction, so it allows writing to
-- ANY column on the caller's own row — including subscription_tier and
-- beta_tester, which should only ever be set server-side (the Stripe
-- webhook, or an admin).
--
-- RLS policies can't restrict individual columns directly, so this
-- uses a trigger: block changes to subscription_tier/beta_tester
-- unless the request is running as service_role (which is how
-- stripe-webhook and any admin tooling built on the service key
-- operate — RLS/this trigger doesn't apply to them either way, but
-- the check is explicit for clarity).
--
-- Also fixes reported_content's UPDATE policy, which was `qual: true`
-- — any authenticated user could mark any moderation report as
-- reviewed/resolved, not just admins. Restricted to the is_admin()
-- function that already existed in this database but wasn't used
-- anywhere.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
      RAISE EXCEPTION 'subscription_tier can only be changed by the payment system';
    END IF;
    IF NEW.beta_tester IS DISTINCT FROM OLD.beta_tester AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'beta_tester can only be changed by an admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_privileged_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_privileged_profile_columns_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_privileged_profile_columns();

DROP POLICY IF EXISTS "Authenticated update reported_content" ON public.reported_content;
CREATE POLICY "Admins update reported_content" ON public.reported_content
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
