-- Safety migration: ensure notifications and profiles schema are correct
-- Uses IF NOT EXISTS / DROP IF EXISTS throughout for idempotency.

-- ── 1. notifications table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  metadata   jsonb       DEFAULT '{}',
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications"          ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications"        ON public.notifications;
DROP POLICY IF EXISTS "Authenticated insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service inserts notifications"         ON public.notifications;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC);

-- ── 2. profiles — username + bio + streak_freeze_count ────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;

-- Partial unique index so multiple NULL usernames are allowed
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_username_search_idx
  ON public.profiles (username);

-- ── 3. public profiles readable by all authenticated users ────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users"
  ON public.profiles;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
