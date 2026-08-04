
-- ===== helper functions =====
CREATE OR REPLACE FUNCTION public.is_guild_member(_guild_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.guild_members WHERE guild_id = _guild_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_party_member(_party_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.party_members WHERE party_id = _party_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_party_visible(_party_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parties p
    WHERE p.id = _party_id
      AND (p.status = 'open' OR p.created_by = _user_id OR public.is_party_member(p.id, _user_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_thread_participant(_thread_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.navi_message_threads t
    WHERE t.id = _thread_id AND (t.sender_user_id = _user_id OR t.receiver_user_id = _user_id)
  );
$$;

-- ===== profiles: replace blanket read with a limited public view =====
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
  SELECT id, display_name, username, navi_name, navi_level, character_class, mbti_type,
         subclass, operator_level, xp_total, current_streak, longest_streak,
         quests_completed, bond_affection, bond_trust, bond_loyalty,
         equipped_skin, custom_title, has_premium_frame, subscription_tier,
         guild_id, last_evolution_tier, perception, luck, created_at, updated_at
  FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO service_role;

-- ===== feed_replies =====
DROP POLICY IF EXISTS "Replies readable by authenticated users" ON public.feed_replies;
CREATE POLICY "Replies readable on public posts" ON public.feed_replies
FOR SELECT TO authenticated
USING (
  operator_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.operator_feed f WHERE f.id = post_id AND (f.is_public OR f.operator_id = auth.uid()))
);

-- ===== guild_members =====
DROP POLICY IF EXISTS "Members can read guild roster" ON public.guild_members;
CREATE POLICY "Guild roster readable by guild members" ON public.guild_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_guild_member(guild_id, auth.uid()));

-- ===== operator_follows =====
DROP POLICY IF EXISTS "follows_read" ON public.operator_follows;
CREATE POLICY "follows_read" ON public.operator_follows
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "follows_self" ON public.operator_follows;
CREATE POLICY "follows_self" ON public.operator_follows
FOR ALL TO authenticated USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);
REVOKE ALL ON public.operator_follows FROM anon;

-- ===== parties / party_members =====
DROP POLICY IF EXISTS "Anyone can read parties" ON public.parties;
CREATE POLICY "Open or joined parties readable" ON public.parties
FOR SELECT TO authenticated
USING (status = 'open' OR created_by = auth.uid() OR public.is_party_member(id, auth.uid()));

DROP POLICY IF EXISTS "Anyone can read party members" ON public.party_members;
CREATE POLICY "Party roster readable by participants" ON public.party_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_party_visible(party_id, auth.uid()));

-- ===== reported_content =====
DROP POLICY IF EXISTS "Authenticated read reported_content" ON public.reported_content;
CREATE POLICY "Admins or reporter read reported_content" ON public.reported_content
FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated update reported_content" ON public.reported_content;

-- ===== storage: message-attachments =====
DROP POLICY IF EXISTS "Message attachments are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update message attachments" ON storage.objects;

CREATE POLICY "Thread participants read message attachments" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND public.is_thread_participant(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Thread participants upload message attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND public.is_thread_participant(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Thread participants update message attachments" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND public.is_thread_participant(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'message-attachments'
  AND public.is_thread_participant(((storage.foldername(name))[1])::uuid, auth.uid())
);

-- ===== lock down SECURITY DEFINER helper execution =====
REVOKE EXECUTE ON FUNCTION public.delete_account_data(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_streak_freeze_if_eligible(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_xp(integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_quest(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_party_quest(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_message_credit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.disband_party(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kick_party_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_shop_item(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_full_navi_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bump_thread_on_new_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_quest_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_skin_paywall() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_privileged_profile_columns() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_post_reaction_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_guild_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_party_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_party_visible(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_thread_participant(uuid, uuid) FROM anon;
