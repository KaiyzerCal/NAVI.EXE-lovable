-- ============================================================
-- purchase_shop_item inserts xp_boost (150 = ×1.5, 24h) and double_xp
-- (200 = ×2.0, 48h) as buffs with stat_affected='xp_multiplier' — but
-- award_xp never read the buffs table, so both paid shop items were
-- cosmetic no-ops. Applied here at the single point both the direct
-- award_xp RPC and complete_quest (which calls award_xp internally) share.
--
-- Same-type buffs don't stack (MAX, not SUM) — a user who buys both
-- xp_boost and double_xp while both are active gets the better one, not
-- 3.5x. modifier_value is a percentage (100 = no change); base _amount is
-- still capped 0-200 as an input-sanity check on the *pre-multiplier*
-- reward, and the multiplier is deliberately applied after that cap so a
-- real boost can legitimately exceed the base 200 ceiling.
-- ============================================================

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
  v_multiplier integer;
  v_effective_amount integer;
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

  SELECT MAX(modifier_value) INTO v_multiplier
    FROM public.buffs
    WHERE user_id = v_user_id
      AND stat_affected = 'xp_multiplier'
      AND expires_at > now();

  v_effective_amount := round(_amount * COALESCE(v_multiplier, 100) / 100.0);

  SELECT operator_xp, operator_level INTO op_xp, op_level FROM public.profiles WHERE id = v_user_id;
  op_xp := COALESCE(op_xp, 0) + v_effective_amount;
  op_level := COALESCE(op_level, 1);
  WHILE op_xp >= (op_level + 1) * 500 LOOP
    op_xp := op_xp - (op_level + 1) * 500;
    op_level := op_level + 1;
  END LOOP;

  PERFORM set_config('app.bypass_economy_guard', 'on', true);
  UPDATE public.profiles
    SET xp_total = COALESCE(xp_total, 0) + v_effective_amount,
        operator_xp = op_xp,
        operator_level = op_level
    WHERE id = v_user_id
    RETURNING xp_total INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$;
