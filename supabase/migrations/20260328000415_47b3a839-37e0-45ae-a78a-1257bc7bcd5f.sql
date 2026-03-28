
-- 1. Fix achievements: drop ALL policy, add SELECT-only for authenticated
DROP POLICY IF EXISTS "Users manage own achievements" ON public.achievements;
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Fix activity_log: drop ALL policy, add SELECT-only and INSERT-only for authenticated
DROP POLICY IF EXISTS "Users manage own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Fix profiles: replace open UPDATE with a restricted one that blocks game-critical columns
-- We use a trigger-based approach: create a function that prevents direct writes to critical cols
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow updates only to non-critical profile fields via a check function
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Block direct client-side changes to game-critical stats
  -- These should only change via service_role (edge functions / naviActions)
  IF (OLD.operator_level IS DISTINCT FROM NEW.operator_level) OR
     (OLD.xp_total IS DISTINCT FROM NEW.xp_total) OR
     (OLD.operator_xp IS DISTINCT FROM NEW.operator_xp) OR
     (OLD.cali_coins IS DISTINCT FROM NEW.cali_coins) OR
     (OLD.codex_points IS DISTINCT FROM NEW.codex_points) OR
     (OLD.bond_affection IS DISTINCT FROM NEW.bond_affection) OR
     (OLD.bond_trust IS DISTINCT FROM NEW.bond_trust) OR
     (OLD.bond_loyalty IS DISTINCT FROM NEW.bond_loyalty) OR
     (OLD.perception IS DISTINCT FROM NEW.perception) OR
     (OLD.luck IS DISTINCT FROM NEW.luck) THEN
    -- Check if the caller is service_role by checking current_setting
    -- If called from client (anon/authenticated), block it
    IF current_setting('role', true) != 'service_role' THEN
      -- Revert the critical fields to their old values
      NEW.operator_level := OLD.operator_level;
      NEW.xp_total := OLD.xp_total;
      NEW.operator_xp := OLD.operator_xp;
      NEW.cali_coins := OLD.cali_coins;
      NEW.codex_points := OLD.codex_points;
      NEW.bond_affection := OLD.bond_affection;
      NEW.bond_trust := OLD.bond_trust;
      NEW.bond_loyalty := OLD.bond_loyalty;
      NEW.perception := OLD.perception;
      NEW.luck := OLD.luck;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_stats
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update_allowed();

-- Re-add the update policy (still user-scoped, trigger handles field protection)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
