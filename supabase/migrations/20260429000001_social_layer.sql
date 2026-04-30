-- ============================================================
-- SOCIAL LAYER MIGRATION
-- navi_messages soft delete · operator_feed · feed_replies · direct_messages
-- ============================================================

-- 1. navi_messages ─ NAVI-to-NAVI operator inbox
-- ============================================================
CREATE TABLE IF NOT EXISTS public.navi_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_navi_name text,
  sender_display_name text,
  recipient_navi_name text,
  content text NOT NULL,
  read_at timestamptz DEFAULT NULL,
  deleted_by_sender boolean NOT NULL DEFAULT false,
  deleted_by_recipient boolean NOT NULL DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.navi_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'navi_messages' AND policyname = 'navi_messages_select') THEN
    CREATE POLICY "navi_messages_select" ON public.navi_messages FOR SELECT TO authenticated
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'navi_messages' AND policyname = 'navi_messages_insert') THEN
    CREATE POLICY "navi_messages_insert" ON public.navi_messages FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'navi_messages' AND policyname = 'navi_messages_update') THEN
    CREATE POLICY "navi_messages_update" ON public.navi_messages FOR UPDATE TO authenticated
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

-- Add soft-delete columns if the table already existed without them
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'navi_messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.navi_messages ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'navi_messages' AND column_name = 'deleted_by_sender') THEN
    ALTER TABLE public.navi_messages ADD COLUMN deleted_by_sender boolean NOT NULL DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'navi_messages' AND column_name = 'deleted_by_recipient') THEN
    ALTER TABLE public.navi_messages ADD COLUMN deleted_by_recipient boolean NOT NULL DEFAULT false;
  END IF;
END $$;


-- 2. operator_feed
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operator_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  navi_name text,
  character_class text,
  mbti_type text,
  operator_level integer DEFAULT 1,
  content_type text NOT NULL,
  -- STATUS | QUEST_COMPLETE | LEVEL_UP | ACHIEVEMENT | STREAK
  -- SKIN_UNLOCK | EVOLUTION | GUILD_EVENT | CUSTOM
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  likes jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.operator_feed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operator_feed' AND policyname = 'feed_select') THEN
    CREATE POLICY "feed_select" ON public.operator_feed FOR SELECT TO authenticated USING (is_public = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operator_feed' AND policyname = 'feed_insert') THEN
    CREATE POLICY "feed_insert" ON public.operator_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operator_feed' AND policyname = 'feed_update') THEN
    CREATE POLICY "feed_update" ON public.operator_feed FOR UPDATE TO authenticated USING (auth.uid() = operator_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operator_feed' AND policyname = 'feed_delete') THEN
    CREATE POLICY "feed_delete" ON public.operator_feed FOR DELETE TO authenticated USING (auth.uid() = operator_id);
  END IF;
END $$;


-- 3. feed_replies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.operator_feed(id) ON DELETE CASCADE NOT NULL,
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feed_replies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_replies' AND policyname = 'replies_select') THEN
    CREATE POLICY "replies_select" ON public.feed_replies FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_replies' AND policyname = 'replies_insert') THEN
    CREATE POLICY "replies_insert" ON public.feed_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_replies' AND policyname = 'replies_delete') THEN
    CREATE POLICY "replies_delete" ON public.feed_replies FOR DELETE TO authenticated USING (auth.uid() = operator_id);
  END IF;
END $$;


-- 4. direct_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read_at timestamptz DEFAULT NULL,
  deleted_by_sender boolean NOT NULL DEFAULT false,
  deleted_by_recipient boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'dm_select') THEN
    CREATE POLICY "dm_select" ON public.direct_messages FOR SELECT TO authenticated
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'dm_insert') THEN
    CREATE POLICY "dm_insert" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'dm_update') THEN
    CREATE POLICY "dm_update" ON public.direct_messages FOR UPDATE TO authenticated
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;
