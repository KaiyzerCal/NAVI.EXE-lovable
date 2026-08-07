-- navi_level was never actually a leveling system — nothing computed it
-- from XP/activity, and it wasn't even in protect_privileged_profile_
-- columns()'s locked-column list, so any authenticated user could PATCH
-- their own navi_level to anything via a direct client update, same as
-- the owner-only preview slider on NaviPage.tsx does (that slider is only
-- UI-gated to isOwner, not actually enforced server-side).
--
-- Fix: navi_level is now derived from cumulative xp_total using the same
-- formula xpSystem.ts already had client-side (levelFromTotalXp /
-- totalXpForLevel) but nothing ever called server-side — ported here so
-- award_xp can compute it authoritatively alongside operator_level's
-- separate per-level-reset math. Locked the column down the same way as
-- the other economy fields, with an is_admin bypass so the owner preview
-- slider keeps working.

CREATE OR REPLACE FUNCTION public.navi_level_from_xp(_total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lvl integer := 1;
BEGIN
  IF _total_xp IS NULL OR _total_xp <= 0 THEN RETURN 1; END IF;
  -- totalXpForLevel(lvl+1) = floor(25*lvl*(lvl+1)*(lvl+2)/3), mirroring
  -- xpSystem.ts's totalXpForLevel/levelFromTotalXp exactly.
  WHILE lvl < 100 AND floor(25.0 * lvl * (lvl + 1) * (lvl + 2) / 3) <= _total_xp LOOP
    lvl := lvl + 1;
  END LOOP;
  RETURN lvl;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp(_amount integer, _user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  new_total INTEGER;
  op_xp INTEGER;
  op_level INTEGER;
BEGIN
  IF auth.role() = 'service_role' AND _user_id IS NOT NULL THEN
    v_user_id := _user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount = 0 THEN
    SELECT xp_total INTO new_total FROM public.profiles WHERE id = v_user_id;
    RETURN COALESCE(new_total, 0);
  END IF;

  IF _amount < 0 OR _amount > 200 THEN
    RAISE EXCEPTION 'XP award out of allowed range (0-200)';
  END IF;

  SELECT operator_xp, operator_level INTO op_xp, op_level FROM public.profiles WHERE id = v_user_id;
  op_xp := COALESCE(op_xp, 0) + _amount;
  op_level := COALESCE(op_level, 1);
  WHILE op_xp >= (op_level + 1) * 500 LOOP
    op_xp := op_xp - (op_level + 1) * 500;
    op_level := op_level + 1;
  END LOOP;

  PERFORM set_config('app.bypass_economy_guard', 'on', true);
  UPDATE public.profiles
    SET xp_total = COALESCE(xp_total, 0) + _amount,
        operator_xp = op_xp,
        operator_level = op_level,
        navi_level = public.navi_level_from_xp(COALESCE(xp_total, 0) + _amount)
    WHERE id = v_user_id
    RETURNING xp_total INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$;

-- Lock navi_level down like the other economy fields, but let an admin
-- (the same check the owner-only NaviPage preview slider already gates
-- on) override it directly — mirrors the existing beta_tester exception.
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
    IF NEW.navi_level IS DISTINCT FROM OLD.navi_level AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'navi_level is earned automatically and can only be overridden by an admin';
    END IF;
    IF NEW.codex_points IS DISTINCT FROM OLD.codex_points
      OR NEW.cali_coins IS DISTINCT FROM OLD.cali_coins
      OR NEW.xp_total IS DISTINCT FROM OLD.xp_total
      OR NEW.operator_xp IS DISTINCT FROM OLD.operator_xp
      OR NEW.operator_level IS DISTINCT FROM OLD.operator_level
      OR NEW.streak_freeze_count IS DISTINCT FROM OLD.streak_freeze_count
      OR NEW.quests_completed IS DISTINCT FROM OLD.quests_completed
    THEN
      RAISE EXCEPTION 'Economy fields can only be changed by a validated server-side function';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- complete_party_quest awards XP via its own inline copy of the level-up
-- math (doesn't delegate to award_xp, since it loops over every party
-- member) — needs the same navi_level computation added.
CREATE OR REPLACE FUNCTION public.complete_party_quest(p_party_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party RECORD;
  v_member_count integer;
  v_xp_share integer;
  v_member RECORD;
  v_op_xp integer;
  v_op_level integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_party FROM public.parties WHERE id = p_party_id AND status = 'open';
  IF v_party IS NULL THEN
    RAISE EXCEPTION 'Party not found or not open';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.party_members WHERE party_id = p_party_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this party';
  END IF;

  SELECT count(*) INTO v_member_count FROM public.party_members WHERE party_id = p_party_id;
  v_xp_share := floor(COALESCE(v_party.xp_pool, 0) / GREATEST(v_member_count, 1));

  PERFORM set_config('app.bypass_economy_guard', 'on', true);

  FOR v_member IN SELECT user_id FROM public.party_members WHERE party_id = p_party_id LOOP
    SELECT operator_xp, operator_level INTO v_op_xp, v_op_level FROM public.profiles WHERE id = v_member.user_id;
    v_op_xp := COALESCE(v_op_xp, 0) + v_xp_share;
    v_op_level := COALESCE(v_op_level, 1);
    WHILE v_op_xp >= (v_op_level + 1) * 500 LOOP
      v_op_xp := v_op_xp - (v_op_level + 1) * 500;
      v_op_level := v_op_level + 1;
    END LOOP;
    UPDATE public.profiles
      SET xp_total = COALESCE(xp_total, 0) + v_xp_share,
          operator_xp = v_op_xp,
          operator_level = v_op_level,
          navi_level = public.navi_level_from_xp(COALESCE(xp_total, 0) + v_xp_share)
      WHERE id = v_member.user_id;
  END LOOP;

  IF v_party.quest_id IS NOT NULL THEN
    UPDATE public.quests SET completed = true, progress = total WHERE id = v_party.quest_id;
  END IF;

  UPDATE public.parties SET status = 'completed' WHERE id = p_party_id;
END;
$$;

-- Recompute navi_level for every existing profile from its actual xp_total
-- (rather than leaving whatever the owner-only preview slider last set it
-- to) now that it's a real, earned stat.
UPDATE public.profiles SET navi_level = public.navi_level_from_xp(xp_total);
