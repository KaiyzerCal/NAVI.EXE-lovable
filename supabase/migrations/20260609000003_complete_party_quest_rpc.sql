-- complete_party_quest: server-side party completion so XP is distributed to
-- all members, not just the calling user.
--
-- Two problems this solves:
--   1. "Users can update own profile" RLS blocks writing other members' rows.
--   2. The protect_profile_stats trigger checks current_setting('role') and
--      reverts XP writes unless role = 'service_role'. SECURITY DEFINER does
--      not change that PostgREST session variable, so we use a safe local flag
--      (app.bypass_xp_protection) that the trigger also checks.

-- ── Step 1: Update the trigger to honour the bypass flag ────────────────────
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.operator_level IS DISTINCT FROM NEW.operator_level) OR
     (OLD.xp_total       IS DISTINCT FROM NEW.xp_total)       OR
     (OLD.operator_xp    IS DISTINCT FROM NEW.operator_xp)    OR
     (OLD.navi_level     IS DISTINCT FROM NEW.navi_level)      OR
     (OLD.current_streak IS DISTINCT FROM NEW.current_streak)  OR
     (OLD.longest_streak IS DISTINCT FROM NEW.longest_streak)  OR
     (OLD.cali_coins     IS DISTINCT FROM NEW.cali_coins)      OR
     (OLD.codex_points   IS DISTINCT FROM NEW.codex_points)    OR
     (OLD.bond_affection IS DISTINCT FROM NEW.bond_affection)  OR
     (OLD.bond_trust     IS DISTINCT FROM NEW.bond_trust)      OR
     (OLD.bond_loyalty   IS DISTINCT FROM NEW.bond_loyalty)    OR
     (OLD.perception     IS DISTINCT FROM NEW.perception)      OR
     (OLD.luck           IS DISTINCT FROM NEW.luck)            THEN

    -- Allow service_role OR internal trusted RPCs (bypass flag set locally)
    IF current_setting('role', true) != 'service_role' AND
       current_setting('app.bypass_xp_protection', true) IS DISTINCT FROM 'true' THEN
      NEW.operator_level  := OLD.operator_level;
      NEW.xp_total        := OLD.xp_total;
      NEW.operator_xp     := OLD.operator_xp;
      NEW.navi_level      := OLD.navi_level;
      NEW.current_streak  := OLD.current_streak;
      NEW.longest_streak  := OLD.longest_streak;
      NEW.cali_coins      := OLD.cali_coins;
      NEW.codex_points    := OLD.codex_points;
      NEW.bond_affection  := OLD.bond_affection;
      NEW.bond_trust      := OLD.bond_trust;
      NEW.bond_loyalty    := OLD.bond_loyalty;
      NEW.perception      := OLD.perception;
      NEW.luck            := OLD.luck;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Step 2: RPC that uses the bypass flag ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_party_quest(p_party_id UUID)
RETURNS INTEGER   -- returns xp_share awarded per member
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party        RECORD;
  v_quest        RECORD;
  v_member       RECORD;
  v_member_count INTEGER;
  v_xp_pool      INTEGER;
  v_xp_share     INTEGER;
BEGIN
  -- Verify caller is a member and is the party leader
  SELECT p.*, pm.role INTO v_party
  FROM   parties p
  JOIN   party_members pm ON pm.party_id = p.id AND pm.user_id = auth.uid()
  WHERE  p.id = p_party_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Party not found or you are not a member';
  END IF;
  IF v_party.role <> 'leader' THEN
    RAISE EXCEPTION 'Only the party leader can complete the quest';
  END IF;
  IF v_party.status NOT IN ('open', 'in_progress') THEN
    RAISE EXCEPTION 'Party quest is already completed or disbanded';
  END IF;

  -- XP pool: prefer linked quest xp_reward, fall back to parties.xp_pool
  v_xp_pool := COALESCE(v_party.xp_pool, 0);
  IF v_party.quest_id IS NOT NULL THEN
    SELECT xp_reward INTO v_quest FROM quests WHERE id = v_party.quest_id;
    IF FOUND AND COALESCE(v_quest.xp_reward, 0) > 0 THEN
      v_xp_pool := v_quest.xp_reward;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM party_members WHERE party_id = p_party_id;
  v_xp_share := FLOOR(v_xp_pool::NUMERIC / GREATEST(v_member_count, 1));

  -- Temporarily allow XP writes for this transaction
  SET LOCAL app.bypass_xp_protection = 'true';

  FOR v_member IN
    SELECT user_id FROM party_members WHERE party_id = p_party_id
  LOOP
    UPDATE profiles
    SET
      operator_xp = COALESCE(operator_xp, 0) + v_xp_share,
      xp_total    = COALESCE(xp_total, 0)    + v_xp_share
    WHERE id = v_member.user_id;
  END LOOP;

  -- Mark linked quest completed (only the quest owner's row is affected by RLS,
  -- but we run SECURITY DEFINER so we bypass it for the leader's quest row)
  IF v_party.quest_id IS NOT NULL THEN
    UPDATE quests
    SET completed = true, progress = total
    WHERE id = v_party.quest_id;
  END IF;

  UPDATE parties SET status = 'completed' WHERE id = p_party_id;

  RETURN v_xp_share;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_party_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_party_quest(UUID) TO authenticated;
