
ALTER TABLE public.navi_messages
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean NOT NULL DEFAULT false;

ALTER TABLE public.navi_message_threads
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quests_completed integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.operator_feed (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,
  navi_name       text,
  character_class text,
  mbti_type       text,
  operator_level  integer     DEFAULT 1,
  content_type    text        NOT NULL,
  content         text        NOT NULL,
  metadata        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  is_public       boolean     NOT NULL DEFAULT true,
  likes           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public feed readable by all authenticated users" ON public.operator_feed;
DROP POLICY IF EXISTS "Operators can insert own feed posts"             ON public.operator_feed;
DROP POLICY IF EXISTS "Operators can update own feed posts"             ON public.operator_feed;
DROP POLICY IF EXISTS "Operators can delete own feed posts"             ON public.operator_feed;

CREATE POLICY "Public feed readable by all authenticated users"
  ON public.operator_feed FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = operator_id);

CREATE POLICY "Operators can insert own feed posts"
  ON public.operator_feed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update own feed posts"
  ON public.operator_feed FOR UPDATE TO authenticated
  USING (auth.uid() = operator_id);

CREATE POLICY "Operators can delete own feed posts"
  ON public.operator_feed FOR DELETE TO authenticated
  USING (auth.uid() = operator_id);

CREATE TABLE IF NOT EXISTS public.feed_replies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid        NOT NULL REFERENCES public.operator_feed(id) ON DELETE CASCADE,
  operator_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  content      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Replies readable by authenticated users" ON public.feed_replies;
DROP POLICY IF EXISTS "Operators insert own replies"            ON public.feed_replies;
DROP POLICY IF EXISTS "Operators delete own replies"            ON public.feed_replies;

CREATE POLICY "Replies readable by authenticated users"
  ON public.feed_replies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Operators insert own replies"
  ON public.feed_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators delete own replies"
  ON public.feed_replies FOR DELETE TO authenticated
  USING (auth.uid() = operator_id);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content              text        NOT NULL,
  read_at              timestamptz DEFAULT NULL,
  deleted_by_sender    boolean     NOT NULL DEFAULT false,
  deleted_by_recipient boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own direct messages"    ON public.direct_messages;
DROP POLICY IF EXISTS "Users send direct messages"             ON public.direct_messages;
DROP POLICY IF EXISTS "Users update their own direct messages" ON public.direct_messages;

CREATE POLICY "Users see their own direct messages"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users send direct messages"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users update their own direct messages"
  ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_pair
  ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_feed_created
  ON public.operator_feed (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_replies_post
  ON public.feed_replies (post_id, created_at);
