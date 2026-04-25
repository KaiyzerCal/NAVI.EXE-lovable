-- Guild quests (guilds + guild_members already exist from prior migration)
CREATE TABLE IF NOT EXISTS guild_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  completed_by uuid REFERENCES profiles(id),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guild_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guild_quests_read" ON guild_quests FOR SELECT USING (true);
CREATE POLICY "guild_quests_write" ON guild_quests FOR ALL USING (
  EXISTS (SELECT 1 FROM guild_members WHERE guild_id = guild_quests.guild_id AND user_id = auth.uid())
);

-- Social feed
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'update',
  metadata jsonb,
  reaction_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '⚡',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Operator follows
CREATE TABLE IF NOT EXISTS operator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- NAVI-to-NAVI messaging
CREATE TABLE IF NOT EXISTS navi_message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_user_id, receiver_user_id)
);

CREATE TABLE IF NOT EXISTS navi_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES navi_message_threads(id) ON DELETE CASCADE,
  sender_navi_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_follows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE navi_message_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE navi_messages         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_read"   ON social_posts     FOR SELECT USING (true);
CREATE POLICY "social_posts_self"   ON social_posts     FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "reactions_read"      ON post_reactions   FOR SELECT USING (true);
CREATE POLICY "reactions_self"      ON post_reactions   FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "follows_read"        ON operator_follows FOR SELECT USING (true);
CREATE POLICY "follows_self"        ON operator_follows FOR ALL    USING (auth.uid() = follower_id);
CREATE POLICY "nmt_self" ON navi_message_threads FOR ALL USING (
  auth.uid() = sender_user_id OR auth.uid() = receiver_user_id
);
CREATE POLICY "nm_self" ON navi_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM navi_message_threads WHERE id = thread_id
    AND (sender_user_id = auth.uid() OR receiver_user_id = auth.uid()))
);

CREATE INDEX IF NOT EXISTS social_posts_feed     ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS navi_messages_thread  ON navi_messages(thread_id, created_at ASC);
