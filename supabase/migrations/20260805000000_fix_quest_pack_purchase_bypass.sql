-- ============================================================
-- SECURITY FIX — free quest-pack acquisition bypass
-- ============================================================
-- UpgradePage.tsx's handlePackPurchase inserted directly into quests and
-- operator_quest_packs from the client with zero currency check, even
-- though quest_packs.forge_price exists specifically to gate this. Any
-- user could grant themselves any quest pack for free.
--
-- Also: forge_balances' RLS policy (FOR ALL USING (auth.uid() = user_id))
-- has no column restriction, so a user could set their own balance/
-- lifetime_earned directly via PATCH — the same privilege-escalation
-- shape already fixed for profiles.subscription_tier in
-- 20260803060000_fix_privilege_escalation.sql. A currency-gated purchase
-- RPC is pointless if the currency itself is client-writable, so both are
-- fixed together here.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_forge_balance_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND COALESCE(current_setting('app.bypass_economy_guard', true), '') <> 'on' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.balance <> 0 OR NEW.lifetime_earned <> 0 THEN
        RAISE EXCEPTION 'forge balance can only be set by the economy system';
      END IF;
    ELSIF NEW.balance IS DISTINCT FROM OLD.balance OR NEW.lifetime_earned IS DISTINCT FROM OLD.lifetime_earned THEN
      RAISE EXCEPTION 'forge balance can only be changed by the economy system';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_forge_balance_columns_trigger ON public.forge_balances;
CREATE TRIGGER protect_forge_balance_columns_trigger
BEFORE INSERT OR UPDATE ON public.forge_balances
FOR EACH ROW
EXECUTE FUNCTION public.protect_forge_balance_columns();

-- Server-side catalog + real balance check, mirroring purchase_shop_item's
-- established pattern (20260803070000_economy_rpcs.sql).
CREATE OR REPLACE FUNCTION public.purchase_quest_pack(p_pack_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack     public.quest_packs%ROWTYPE;
  v_balance  integer;
  v_template jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_pack FROM public.quest_packs WHERE id = p_pack_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest pack not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.operator_quest_packs WHERE user_id = auth.uid() AND pack_id = p_pack_id) THEN
    RAISE EXCEPTION 'Quest pack already owned';
  END IF;

  SELECT balance INTO v_balance FROM public.forge_balances WHERE user_id = auth.uid();
  IF COALESCE(v_balance, 0) < v_pack.forge_price THEN
    RAISE EXCEPTION 'Insufficient forge balance';
  END IF;

  PERFORM set_config('app.bypass_economy_guard', 'on', true);

  UPDATE public.forge_balances
  SET balance = balance - v_pack.forge_price, updated_at = now()
  WHERE user_id = auth.uid();

  INSERT INTO public.forge_transactions (user_id, amount, reason, metadata)
  VALUES (auth.uid(), -v_pack.forge_price, 'quest_pack_purchase',
          jsonb_build_object('pack_id', p_pack_id, 'pack_slug', v_pack.slug));

  FOR v_template IN SELECT * FROM jsonb_array_elements(v_pack.quest_templates)
  LOOP
    INSERT INTO public.quests (user_id, name, description, type, total, xp_reward, progress, completed)
    VALUES (
      auth.uid(),
      v_template->>'name',
      COALESCE(v_template->>'description', ''),
      COALESCE(v_template->>'type', 'Daily'),
      1,
      COALESCE((v_template->>'xp_reward')::integer, 50),
      0,
      false
    );
  END LOOP;

  INSERT INTO public.operator_quest_packs (user_id, pack_id) VALUES (auth.uid(), p_pack_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_quest_pack(uuid) FROM anon;
