-- ============================================================
-- Close two paywall bypasses that had zero server-side enforcement:
--
-- 1. quests: RLS only checked auth.uid()=user_id, no row-count limit. Any
--    free-tier user could insert unlimited quests from devtools — the
--    3-active-quest free-tier cap (usePaywall.ts's canCreateQuest) was pure
--    client JS. This also made the "Quest Slot +1" shop item a no-op: the
--    buff it grants (buffs.stat_affected='quest_slots') was never read
--    anywhere. Both fixed together below.
--
-- 2. profiles.equipped_skin: free text, no CHECK constraint, not in the
--    protected-columns trigger. Any free-tier user could equip any premium
--    skin directly via `.update({equipped_skin: ...})` — canEquipSkin was
--    also pure client JS. The 'elite_trial' shop buff (7-day skin access)
--    is honored here too.
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_full_navi_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND subscription_tier IN ('core', 'power')
    )
    OR public.has_role(_user_id, 'owner')
$$;

-- ── Quest slot limit ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_quest_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _active_count integer;
  _bonus_slots integer;
  _limit integer;
BEGIN
  IF public.has_full_navi_access(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO _active_count
    FROM public.quests
    WHERE user_id = NEW.user_id AND completed = false;

  SELECT COALESCE(SUM(modifier_value), 0) INTO _bonus_slots
    FROM public.buffs
    WHERE user_id = NEW.user_id
      AND stat_affected = 'quest_slots'
      AND expires_at > now();

  _limit := 3 + _bonus_slots; -- mirrors FREE_LIMITS.MAX_ACTIVE_QUESTS in usePaywall.ts

  IF _active_count >= _limit THEN
    RAISE EXCEPTION 'Active quest limit reached (% of %). Upgrade to Core or buy a Quest Slot for more.', _active_count, _limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_quest_limit_trigger ON public.quests;
CREATE TRIGGER enforce_quest_limit_trigger
  BEFORE INSERT ON public.quests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_quest_limit();

-- ── Skin equip gate ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_skin_paywall()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Mirrors FREE_SKINS in src/hooks/usePaywall.ts — keep in sync.
  _free_skins text[] := ARRAY['NETOP', 'GUARDIAN', 'WOLF', 'DEERLING', 'SCHOLAR'];
  _has_trial boolean;
BEGIN
  IF NEW.equipped_skin IS DISTINCT FROM OLD.equipped_skin
     AND NEW.equipped_skin IS NOT NULL
     AND auth.role() <> 'service_role'
  THEN
    IF public.has_full_navi_access(NEW.id) THEN
      RETURN NEW;
    END IF;

    IF upper(NEW.equipped_skin) = ANY(_free_skins) THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.buffs
      WHERE user_id = NEW.id AND stat_affected = 'skin_trial' AND expires_at > now()
    ) INTO _has_trial;

    IF NOT _has_trial THEN
      RAISE EXCEPTION 'Skin "%" requires Core/Power or an active Elite Skin Trial', NEW.equipped_skin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_skin_paywall_trigger ON public.profiles;
CREATE TRIGGER enforce_skin_paywall_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_skin_paywall();
