-- ============================================================
-- CRITICAL GAPS MIGRATION
-- pgvector, operator_handle, notifications, follows,
-- omni_memories, reported_content
-- ============================================================

-- 1. pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Unique operator handle on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operator_handle text;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_operator_handle_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_operator_handle_key UNIQUE (operator_handle);
  END IF;
END $$;

-- 3. In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL,
  title       text        NOT NULL,
  body        text,
  read        boolean     NOT NULL DEFAULT false,
  actor_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name  text,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notif_select_own' AND tablename = 'notifications') THEN
    CREATE POLICY notif_select_own ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notif_insert_any' AND tablename = 'notifications') THEN
    CREATE POLICY notif_insert_any ON notifications FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notif_update_own' AND tablename = 'notifications') THEN
    CREATE POLICY notif_update_own ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notif_delete_own' AND tablename = 'notifications') THEN
    CREATE POLICY notif_delete_own ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx ON notifications (user_id, read);

-- 4. Operator follows (friend/follow graph)
CREATE TABLE IF NOT EXISTS operator_follows (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);
ALTER TABLE operator_follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'follows_manage_own' AND tablename = 'operator_follows') THEN
    CREATE POLICY follows_manage_own ON operator_follows FOR ALL TO authenticated
      USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'follows_read_all' AND tablename = 'operator_follows') THEN
    CREATE POLICY follows_read_all ON operator_follows FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS follows_follower_idx ON operator_follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON operator_follows (following_id);

-- 5. OmniSync memory packets (pgvector)
CREATE TABLE IF NOT EXISTS omni_memories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  summary    text        NOT NULL,
  raw_packet jsonb       NOT NULL DEFAULT '{}',
  embedding  vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE omni_memories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'omni_select_own' AND tablename = 'omni_memories') THEN
    CREATE POLICY omni_select_own ON omni_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'omni_insert_own' AND tablename = 'omni_memories') THEN
    CREATE POLICY omni_insert_own ON omni_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'omni_delete_own' AND tablename = 'omni_memories') THEN
    CREATE POLICY omni_delete_own ON omni_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS omni_memories_user_id_idx ON omni_memories (user_id);

-- 6. Content moderation: reported_content
CREATE TABLE IF NOT EXISTS reported_content (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text        NOT NULL,
  content_id   text        NOT NULL,
  reason       text,
  reviewed     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_insert_own' AND tablename = 'reported_content') THEN
    CREATE POLICY reports_insert_own ON reported_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_select_own' AND tablename = 'reported_content') THEN
    CREATE POLICY reports_select_own ON reported_content FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
  END IF;
END $$;
