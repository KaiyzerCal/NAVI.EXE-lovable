-- ============================================================
-- ACCOUNT DELETION
-- ============================================================
-- Backs the in-app "Delete Account" feature (App Store review
-- guideline 5.1.1(v) requires in-app deletion, not just an email
-- request — Play Console's account-deletion requirement wants the
-- same). Verified against the live schema: almost nothing actually
-- cascades from profiles/auth.users (only operator_follows and
-- push_subscriptions have real FK constraints) — every other
-- user-owned table needs an explicit delete here or the row is
-- simply orphaned forever.
--
-- Restricted to service_role only — this is called from the
-- delete-account edge function *after* it verifies the caller's own
-- JWT, never directly from client code. Do not grant EXECUTE to
-- authenticated/anon.
--
-- Known, intentional scope limits (documented, not silent gaps):
--   - subscriptions rows are kept (billing/accounting retention,
--     matches the Privacy Policy's stated exception)
--   - reported_content rows are kept (trust & safety history predates
--     any one reporter's account)
--   - guilds/parties/guild_quests the user created are only deleted
--     if they have no OTHER members — if other members remain, the
--     group stays and created_by is left pointing at the deleted
--     account (created_by is NOT NULL on all three, and building
--     real ownership-transfer is out of scope for this feature)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.achievements WHERE user_id = p_user_id;
  DELETE FROM public.activity_log WHERE user_id = p_user_id;
  DELETE FROM public.agent_tasks WHERE user_id = p_user_id;
  DELETE FROM public.beta_feedback WHERE user_id = p_user_id;
  DELETE FROM public.buffs WHERE user_id = p_user_id;
  DELETE FROM public.chat_messages WHERE user_id = p_user_id;
  DELETE FROM public.chat_conversations WHERE user_id = p_user_id;
  DELETE FROM public.direct_messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
  DELETE FROM public.equipment WHERE user_id = p_user_id;
  DELETE FROM public.feed_replies WHERE operator_id = p_user_id;
  DELETE FROM public.journal_entries WHERE user_id = p_user_id;
  DELETE FROM public.media WHERE user_id = p_user_id;
  DELETE FROM public.mini_game_scores WHERE user_id = p_user_id;
  DELETE FROM public.navi_core_memory WHERE user_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.operator_feed WHERE operator_id = p_user_id;
  DELETE FROM public.operator_quest_packs WHERE user_id = p_user_id;
  DELETE FROM public.post_reactions WHERE user_id = p_user_id;
  DELETE FROM public.quests WHERE user_id = p_user_id;
  DELETE FROM public.skills WHERE user_id = p_user_id;
  DELETE FROM public.social_posts WHERE user_id = p_user_id;
  DELETE FROM public.subskills WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.user_unlocked_skins WHERE user_id = p_user_id;

  -- NAVI DMs: remove every message in any thread involving this user
  -- (not just their own sent messages), then the thread rows.
  DELETE FROM public.navi_messages
  WHERE thread_id IN (
    SELECT id FROM public.navi_message_threads
    WHERE sender_user_id = p_user_id OR receiver_user_id = p_user_id
  );
  DELETE FROM public.navi_message_threads
  WHERE sender_user_id = p_user_id OR receiver_user_id = p_user_id;

  -- Party/guild membership: always safe to remove the user's own row.
  DELETE FROM public.party_members WHERE user_id = p_user_id;
  DELETE FROM public.guild_members WHERE user_id = p_user_id;

  -- Parties created by this user: delete only if no one else is left in them.
  DELETE FROM public.party_members
  WHERE party_id IN (
    SELECT p.id FROM public.parties p
    WHERE p.created_by = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.party_members pm
        WHERE pm.party_id = p.id AND pm.user_id <> p_user_id
      )
  );
  DELETE FROM public.parties p
  WHERE p.created_by = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.party_members pm WHERE pm.party_id = p.id
    );

  -- Guilds created by this user: delete (with their quests) only if
  -- no one else is a member.
  DELETE FROM public.guild_quests
  WHERE guild_id IN (
    SELECT g.id FROM public.guilds g
    WHERE g.created_by = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.guild_members gm
        WHERE gm.guild_id = g.id AND gm.user_id <> p_user_id
      )
  );
  DELETE FROM public.guilds g
  WHERE g.created_by = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = g.id
    );

  -- Finally, the profile itself. operator_follows and
  -- push_subscriptions cascade from this automatically (real FK
  -- constraints, verified live).
  DELETE FROM public.profiles WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(uuid) TO service_role;
