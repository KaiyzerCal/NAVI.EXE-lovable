-- ============================================================
-- Two party bugs from the same root cause: party_members RLS only allows
-- "Users manage own party membership" (auth.uid() = user_id) — there is no
-- leader-override policy at all.
--
-- 1. kickMember (useParty.ts) did `delete from party_members where id =
--    memberId` with no user_id filter matching the caller — under RLS this
--    matches zero rows for anyone but the target themselves, so the leader's
--    "kick" button silently did nothing.
-- 2. disbandParty did `delete from party_members where party_id = X` with no
--    user_id filter — same problem: only the *caller's own* row is
--    actually removed, every other member is left attached to a party
--    that's now marked 'disbanded'.
--
-- Both fixed as SECURITY DEFINER RPCs that verify the caller is actually
-- the party's leader/creator server-side, rather than widening the RLS
-- policy (which would let any leader-flagged row bypass ownership checks
-- more broadly than these two specific actions need).
-- ============================================================

CREATE OR REPLACE FUNCTION public.kick_party_member(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party_id uuid;
  v_target_user_id uuid;
  v_is_leader boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT party_id, user_id INTO v_party_id, v_target_user_id
    FROM public.party_members WHERE id = p_member_id;

  IF v_party_id IS NULL THEN
    RAISE EXCEPTION 'Party member not found';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Use leaveParty to remove yourself';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = v_party_id AND user_id = auth.uid() AND role = 'leader'
  ) INTO v_is_leader;

  IF NOT v_is_leader THEN
    RAISE EXCEPTION 'Only the party leader can remove members';
  END IF;

  DELETE FROM public.party_members WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.disband_party(p_party_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.parties WHERE id = p_party_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the party creator can disband it';
  END IF;

  UPDATE public.parties SET status = 'disbanded' WHERE id = p_party_id;
  DELETE FROM public.party_members WHERE party_id = p_party_id;
END;
$$;
