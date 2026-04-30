-- Social layer foundation: NAVI inbox soft delete, operator feed, replies, direct messages

ALTER TABLE public.navi_messages
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by_sender boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.operator_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  navi_name text,
  character_class text,
  mbti_type text,
  operator_level integer DEFAULT 1,
  content_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  likes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.operator_feed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public feed readable by all authenticated users"
    ON public.operator_feed FOR SELECT
    TO authenticated
    USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Operators can insert own feed posts"
    ON public.operator_feed FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Operators can update own feed posts"
    ON public.operator_feed FOR UPDATE
    TO authenticated
    USING (auth.uid() = operator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Operators can delete own feed posts"
    ON public.operator_feed FOR DELETE
    TO authenticated
    USING (auth.uid() = operator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.feed_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.operator_feed(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feed_replies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Replies readable by authenticated users"
    ON public.feed_replies FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Operators insert own replies"
    ON public.feed_replies FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz DEFAULT NULL,
  deleted_by_sender boolean DEFAULT false,
  deleted_by_recipient boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users see their own messages"
    ON public.direct_messages FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users send messages"
    ON public.direct_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update their own messages"
    ON public.direct_messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
