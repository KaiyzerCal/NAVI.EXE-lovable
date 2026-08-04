-- ============================================================
-- 20260804010000_close_quest_and_skin_paywall_gaps.sql's
-- has_full_navi_access(_user_id) checked subscription_tier IN ('core',
-- 'power') and has_role(_user_id, 'owner') — written against a stale local
-- checkout that didn't yet know about the 'elite' tier or the
-- admin_users/is_admin() model added in 20260504100000_paywall_live.sql
-- (which predates this fix but wasn't in the tree used to write it).
--
-- Net effect: any real admin or 'elite'-tier operator was incorrectly
-- blocked by the quest-limit and skin-equip triggers this function backs,
-- since 'elite' didn't match ('core','power') and is_admin() (which also
-- covers admin_users, not just user_roles.role='owner') was never checked.
-- Live since the previous migration applied — fixed here to match the
-- actual current tier model (usePaywall.ts: hasFullAccess = isOwner ||
-- isCore, where isCore includes isElite).
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_full_navi_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND subscription_tier IN ('core', 'elite')
    )
$$;
