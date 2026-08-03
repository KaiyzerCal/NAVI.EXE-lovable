-- ============================================================
-- ECONOMY HARDENING — server-authoritative rewards
-- ============================================================
-- Follow-up to the subscription_tier privilege-escalation fix. Same
-- root cause, smaller blast radius: codex_points, cali_coins,
-- xp_total, operator_xp, operator_level, streak_freeze_count are all
-- writable by the owning user with no server-side validation that the
-- write corresponds to something real. Concretely, before this
-- migration:
--   - ShopPage.tsx computes the new balance client-side and PATCHes it
--   - useParty.ts awards XP to every party member via direct PATCH
--   - award_xp(amount) existed but trusted whatever amount the client
--     sent, and only touched xp_total (not operator_xp/operator_level
--     — so completing quests through the Quests page never actually
--     leveled anyone up; only NAVI-chat-triggered completions did,
--     because navi-actions' quest_complete handler duplicated the
--     reward logic separately and more completely)
--   - toggleQuest() re-calls award_xp on every completion with no
--     guard against toggling a quest off and back on to farm XP
--
-- This migration: award_xp now does the full level-up math and is
-- amount-capped; complete_quest/purchase_shop_item/complete_party_quest
-- are new validated RPCs that compute rewards from the actual quest/
-- item/party row instead of trusting client input; and a trigger locks
-- the underlying columns to service_role or these specific RPCs only.
--
-- forge_balances/forge_transactions are deliberately not touched here
-- — those tables don't exist live, and the "replaces former Forge
-- economy" comment already in navi-actions confirms codex/cali
-- superseded it. That dead code is removed, not ported forward.
-- ============================================================

-- ── award_xp: now does real level-up math, capped, and marks itself
--    as a blessed writer for the column-lock trigger below ──────────
-- _user_id is only honored when the caller is service_role (navi-actions,
-- which authenticates its own caller separately and can't rely on
-- auth.uid() since it calls through with the service key) — a normal
-- authenticated user can never use it to act on anyone but themselves.
-- Dropped first since adding a parameter isn't a compatible signature
-- for CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.award_xp(integer);
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
        operator_level = op_level
    WHERE id = v_user_id
    RETURNING xp_total INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$;

-- ── complete_quest: the one correct quest-completion path, used by
--    both the manual "mark complete" button and NAVI chat ──────────
-- p_user_id: same service_role-only override pattern as award_xp above.
DROP FUNCTION IF EXISTS public.complete_quest(uuid);
CREATE OR REPLACE FUNCTION public.complete_quest(p_quest_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_quest RECORD;
  v_codex_map jsonb := '{"Daily":10,"Weekly":30,"Main":50,"Side":20,"Minor":5,"Epic":100}'::jsonb;
  v_cali_map  jsonb := '{"Daily":2,"Weekly":8,"Main":12,"Side":5,"Minor":1,"Epic":25}'::jsonb;
  v_codex_reward integer;
  v_cali_reward integer;
  v_skill RECORD;
  v_skill_xp integer;
  v_skill_level integer;
  v_prof RECORD;
BEGIN
  IF auth.role() = 'service_role' AND p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Row lock + completed=false filter together are what block toggle-
  -- farming: once this UPDATE lands, a repeat call finds zero rows.
  UPDATE public.quests
    SET completed = true, progress = total
    WHERE id = p_quest_id AND user_id = v_user_id AND completed = false
    RETURNING * INTO v_quest;

  IF v_quest IS NULL THEN
    RAISE EXCEPTION 'Quest not found or already completed';
  END IF;

  PERFORM public.award_xp(LEAST(GREATEST(COALESCE(v_quest.xp_reward, 0), 0), 200), v_user_id);

  v_codex_reward := COALESCE((v_codex_map ->> COALESCE(v_quest.type, 'Daily'))::integer, 10);
  v_cali_reward  := COALESCE((v_cali_map  ->> COALESCE(v_quest.type, 'Daily'))::integer, 2);

  PERFORM set_config('app.bypass_economy_guard', 'on', true);
  UPDATE public.profiles
    SET codex_points = COALESCE(codex_points, 0) + v_codex_reward,
        cali_coins = COALESCE(cali_coins, 0) + v_cali_reward,
        quests_completed = COALESCE(quests_completed, 0) + 1
    WHERE id = v_user_id;

  IF v_quest.linked_skill_id IS NOT NULL THEN
    SELECT * INTO v_skill FROM public.skills WHERE id = v_quest.linked_skill_id AND user_id = v_user_id;
    IF v_skill IS NOT NULL THEN
      v_skill_xp := COALESCE(v_skill.xp, 0) + 25;
      v_skill_level := COALESCE(v_skill.level, 1);
      WHILE v_skill_level < COALESCE(v_skill.max_level, 10) AND v_skill_xp >= v_skill_level * 100 LOOP
        v_skill_xp := v_skill_xp - v_skill_level * 100;
        v_skill_level := v_skill_level + 1;
      END LOOP;
      UPDATE public.skills SET level = v_skill_level, xp = v_skill_xp WHERE id = v_quest.linked_skill_id;
    END IF;
  END IF;

  INSERT INTO public.activity_log (user_id, event_type, description, xp_amount)
    VALUES (v_user_id, 'quest_completed', 'Quest completed: ' || v_quest.name, COALESCE(v_quest.xp_reward, 0));

  SELECT display_name, navi_name, character_class, mbti_type, operator_level INTO v_prof
    FROM public.profiles WHERE id = v_user_id;
  INSERT INTO public.operator_feed
    (operator_id, display_name, navi_name, character_class, mbti_type, operator_level, content_type, content, metadata, likes, is_public)
    VALUES (
      v_user_id, v_prof.display_name, v_prof.navi_name, v_prof.character_class, v_prof.mbti_type, v_prof.operator_level,
      'QUEST_COMPLETE', COALESCE(v_prof.display_name, 'Operator') || ' completed the quest: ' || v_quest.name,
      jsonb_build_object('quest_name', v_quest.name, 'quest_type', v_quest.type, 'xp_earned', v_quest.xp_reward),
      '[]'::jsonb, true
    );
END;
$$;

-- ── purchase_shop_item: server-side catalog, real balance check ─────
CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_item_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost integer;
  v_currency text;
  v_balance integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  CASE p_item_id
    WHEN 'streak_shield'  THEN v_cost := 150; v_currency := 'codex';
    WHEN 'xp_boost'       THEN v_cost := 200; v_currency := 'codex';
    WHEN 'quest_slot'     THEN v_cost := 300; v_currency := 'codex';
    WHEN 'memory_reset'   THEN v_cost := 100; v_currency := 'codex';
    WHEN 'title_shadow'   THEN v_cost := 500; v_currency := 'codex';
    WHEN 'premium_frame'  THEN v_cost := 10;  v_currency := 'cali';
    WHEN 'double_xp'      THEN v_cost := 25;  v_currency := 'cali';
    WHEN 'elite_trial'    THEN v_cost := 15;  v_currency := 'cali';
    ELSE RAISE EXCEPTION 'Unknown shop item: %', p_item_id;
  END CASE;

  IF v_currency = 'codex' THEN
    SELECT codex_points INTO v_balance FROM public.profiles WHERE id = auth.uid();
  ELSE
    SELECT cali_coins INTO v_balance FROM public.profiles WHERE id = auth.uid();
  END IF;

  IF COALESCE(v_balance, 0) < v_cost THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  PERFORM set_config('app.bypass_economy_guard', 'on', true);

  IF v_currency = 'codex' THEN
    UPDATE public.profiles SET codex_points = codex_points - v_cost WHERE id = auth.uid();
  ELSE
    UPDATE public.profiles SET cali_coins = cali_coins - v_cost WHERE id = auth.uid();
  END IF;

  CASE p_item_id
    WHEN 'streak_shield' THEN
      UPDATE public.profiles SET streak_freeze_count = COALESCE(streak_freeze_count, 0) + 1 WHERE id = auth.uid();
    WHEN 'xp_boost' THEN
      INSERT INTO public.buffs (user_id, name, description, effect_type, stat_affected, modifier_value, duration_hours, source, expires_at)
        VALUES (auth.uid(), 'XP Boost', '1.5× XP for 24 hours', 'buff', 'xp_multiplier', 150, 24, 'shop', now() + interval '24 hours');
    WHEN 'quest_slot' THEN
      INSERT INTO public.buffs (user_id, name, description, effect_type, stat_affected, modifier_value, duration_hours, source, expires_at)
        VALUES (auth.uid(), 'Quest Slot', 'Extra quest slot for 7 days', 'buff', 'quest_slots', 1, 168, 'shop', now() + interval '168 hours');
    WHEN 'memory_reset' THEN
      DELETE FROM public.navi_core_memory WHERE user_id = auth.uid();
    WHEN 'title_shadow' THEN
      UPDATE public.profiles SET custom_title = 'Shadow Operative' WHERE id = auth.uid();
    WHEN 'premium_frame' THEN
      UPDATE public.profiles SET has_premium_frame = true WHERE id = auth.uid();
    WHEN 'double_xp' THEN
      INSERT INTO public.buffs (user_id, name, description, effect_type, stat_affected, modifier_value, duration_hours, source, expires_at)
        VALUES (auth.uid(), 'Double XP', '2× XP for 48 hours', 'buff', 'xp_multiplier', 200, 48, 'shop', now() + interval '48 hours');
    WHEN 'elite_trial' THEN
      INSERT INTO public.buffs (user_id, name, description, effect_type, stat_affected, modifier_value, duration_hours, source, expires_at)
        VALUES (auth.uid(), 'Elite Skin Trial', '7-day access to Elite skins', 'buff', 'skin_trial', 7, 168, 'shop', now() + interval '168 hours');
  END CASE;
END;
$$;

-- ── complete_party_quest: awards every member from server-computed
--    shares, not client-supplied ones ────────────────────────────────
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
          operator_level = v_op_level
      WHERE id = v_member.user_id;
  END LOOP;

  IF v_party.quest_id IS NOT NULL THEN
    UPDATE public.quests SET completed = true, progress = total WHERE id = v_party.quest_id;
  END IF;

  UPDATE public.parties SET status = 'completed' WHERE id = p_party_id;
END;
$$;

-- ── Lock the columns down: only service_role, or these RPCs (via the
--    transaction-local bypass flag they set), may write them ────────
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
    THEN
      RAISE EXCEPTION 'Economy fields can only be changed by a validated server-side function';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
