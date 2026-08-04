-- Ensure all columns and tables required by InboxPage + SearchPage exist.
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout).

-- ── navi_message_threads: soft-delete + unread counters ──────────────────────
ALTER TABLE public.navi_message_threads
  ADD COLUMN IF NOT EXISTS sender_unread    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receiver_unread  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean NOT NULL DEFAULT false;

-- ── navi_messages: sender tracking + attachments + soft-delete ───────────────
ALTER TABLE public.navi_messages
  ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS attachment_url  text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean NOT NULL DEFAULT false;

-- ── profiles: username for search ────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username) WHERE username IS NOT NULL;

-- ── direct_messages (DM unread counter) ──────────────────────────────────────
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

-- ── profiles: ensure public read policy exists ────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users"
  ON public.profiles;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- ── notifications (required by fix_search_notifications) ─────────────────────
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

DROP POLICY IF EXISTS "Users read own notifications"           ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications"         ON public.notifications;
DROP POLICY IF EXISTS "Authenticated insert own notifications" ON public.notifications;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Trigger: increment recipient's unread on new message ─────────────────────
CREATE OR REPLACE FUNCTION increment_thread_unread()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE navi_message_threads
  SET
    receiver_unread = CASE
      WHEN NEW.sender_user_id = sender_user_id THEN receiver_unread + 1
      ELSE receiver_unread
    END,
    sender_unread = CASE
      WHEN NEW.sender_user_id = receiver_user_id THEN sender_unread + 1
      ELSE sender_unread
    END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_thread_unread ON navi_messages;
CREATE TRIGGER trg_increment_thread_unread
  AFTER INSERT ON navi_messages
  FOR EACH ROW EXECUTE FUNCTION increment_thread_unread();
