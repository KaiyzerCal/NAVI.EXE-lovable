ALTER TABLE public.navi_message_threads
  ADD COLUMN IF NOT EXISTS sender_unread INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receiver_unread INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.navi_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;