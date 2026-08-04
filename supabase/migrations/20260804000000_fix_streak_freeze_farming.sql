-- ============================================================
-- Close the streak-freeze farming exploit.
--
-- award_streak_freeze (navi-actions/index.ts, service_role) incremented
-- streak_freeze_count with no eligibility check at all — any authenticated
-- user could call it in a loop for unlimited free copies of an item the
-- shop otherwise sells for 150 Codex Points. Fixing it server-side requires
-- a trustworthy current_streak, and a way to know whether this exact
-- milestone was already paid out — this migration adds both.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_streak_freeze_milestone integer NOT NULL DEFAULT 0;

-- Lock the new tracking column down the same way the rest of the economy
-- columns are locked: only service_role (i.e. only the validated RPC/edge
-- function path below) may change it.
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND current_setting('app.bypass_economy_guard', true) IS DISTINCT FROM 'on' THEN
    IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
      RAISE EXCEPTION 'subscription_tier can only be changed by the payment system';
    END IF;
    IF NEW.beta_tester IS DISTINCT FROM OLD.beta_tester AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'beta_tester can only be changed by an admin';
    END IF;
    IF NEW.codex_points IS DISTINCT FROM OLD.codex_points
      OR NEW.cali_coins IS DISTINCT FROM OLD.cali_coins
      OR NEW.xp_total IS DISTINCT FROM OLD.xp_total
      OR NEW.operator_xp IS DISTINCT FROM OLD.operator_xp
      OR NEW.operator_level IS DISTINCT FROM OLD.operator_level
      OR NEW.streak_freeze_count IS DISTINCT FROM OLD.streak_freeze_count
      OR NEW.quests_completed IS DISTINCT FROM OLD.quests_completed
      OR NEW.last_streak_freeze_milestone IS DISTINCT FROM OLD.last_streak_freeze_milestone
    THEN
      RAISE EXCEPTION 'Economy fields can only be changed by a validated server-side function';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Atomic, validated award: only fires if current_streak (itself already
-- protected by check_profile_update_allowed / the trigger above) is a
-- positive multiple of 7 that hasn't already been paid out. Replaces the
-- unconditional increment in navi-actions/index.ts's award_streak_freeze
-- case, which is updated to call this instead.
DROP FUNCTION IF EXISTS public.award_streak_freeze_if_eligible(uuid);

CREATE FUNCTION public.award_streak_freeze_if_eligible(_user_id uuid)
RETURNS TABLE(awarded boolean, new_freeze_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _streak integer;
  _last_milestone integer;
  _current_count integer;
BEGIN
  SELECT p.current_streak, p.last_streak_freeze_milestone, p.streak_freeze_count
    INTO _streak, _last_milestone, _current_count
    FROM public.profiles p
    WHERE p.id = _user_id
    FOR UPDATE;

  IF _streak IS NULL OR _streak <= 0 OR _streak % 7 <> 0 OR _streak <= _last_milestone THEN
    RETURN QUERY SELECT false, _current_count;
    RETURN;
  END IF;

  _current_count := _current_count + 1;

  UPDATE public.profiles
    SET streak_freeze_count = _current_count,
        last_streak_freeze_milestone = _streak
    WHERE id = _user_id;

  RETURN QUERY SELECT true, _current_count;
END;
$$;
