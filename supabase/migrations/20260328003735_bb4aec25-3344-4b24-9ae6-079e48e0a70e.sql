CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.operator_level IS DISTINCT FROM NEW.operator_level) OR
     (OLD.xp_total IS DISTINCT FROM NEW.xp_total) OR
     (OLD.operator_xp IS DISTINCT FROM NEW.operator_xp) OR
     (OLD.navi_level IS DISTINCT FROM NEW.navi_level) OR
     (OLD.current_streak IS DISTINCT FROM NEW.current_streak) OR
     (OLD.longest_streak IS DISTINCT FROM NEW.longest_streak) OR
     (OLD.cali_coins IS DISTINCT FROM NEW.cali_coins) OR
     (OLD.codex_points IS DISTINCT FROM NEW.codex_points) OR
     (OLD.bond_affection IS DISTINCT FROM NEW.bond_affection) OR
     (OLD.bond_trust IS DISTINCT FROM NEW.bond_trust) OR
     (OLD.bond_loyalty IS DISTINCT FROM NEW.bond_loyalty) OR
     (OLD.perception IS DISTINCT FROM NEW.perception) OR
     (OLD.luck IS DISTINCT FROM NEW.luck) THEN
    IF current_setting('role', true) != 'service_role' THEN
      NEW.operator_level := OLD.operator_level;
      NEW.xp_total := OLD.xp_total;
      NEW.operator_xp := OLD.operator_xp;
      NEW.navi_level := OLD.navi_level;
      NEW.current_streak := OLD.current_streak;
      NEW.longest_streak := OLD.longest_streak;
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
$function$;