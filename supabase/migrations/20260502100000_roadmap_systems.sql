-- =====================================================================
-- ROADMAP SYSTEMS: username, notifications, streak freeze,
-- reported_content, operator bio
-- =====================================================================

-- 1. UNIQUE OPERATOR USERNAME / HANDLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username         text UNIQUE,
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- 2. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL,
  -- LEVEL_UP | EVOLUTION | STREAK | STREAK_RISK | DM | QUEST_DUE |
  -- ACHIEVEMENT | PARTY_INVITE | GUILD_INVITE | FEED_LIKE | SYSTEM
  title        text        NOT NULL,
  body         text,
  metadata     jsonb       DEFAULT '{}',
  read         boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service inserts notifications"  ON public.notifications;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypasses RLS so edge functions can insert freely.
-- Client can also insert for self-notifications (DM toasts, etc.).
CREATE POLICY "Authenticated insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC);

-- 3. CONTENT MODERATION — REPORTED CONTENT
CREATE TABLE IF NOT EXISTS public.reported_content (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text        NOT NULL,
  -- FEED_POST | DM | GUILD_POST | PROFILE | REPLY
  content_id   text        NOT NULL,
  reason       text,
  reviewed     boolean     NOT NULL DEFAULT false,
  action_taken text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reported_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own reports"    ON public.reported_content;
DROP POLICY IF EXISTS "Admins read reported_content" ON public.reported_content;

CREATE POLICY "Users insert own reports"
  ON public.reported_content FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Admins read via service role (bypasses RLS).
-- For client-side admin panel, also allow authenticated users to read all.
CREATE POLICY "Authenticated read reported_content"
  ON public.reported_content FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated update reported_content"
  ON public.reported_content FOR UPDATE TO authenticated
  USING (true);
