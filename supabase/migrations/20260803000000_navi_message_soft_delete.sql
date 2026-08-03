-- ============================================================
-- Add the soft-delete columns InboxPage.tsx already expects
-- ============================================================
-- navi_message_threads and navi_messages have a fully-built soft-delete
-- feature — deleteThread(), deleteMessage(), and isDeleted() all reference
-- deleted_by_sender/deleted_by_recipient — but the columns were never
-- actually added to either table (they only ever existed on the separate
-- direct_messages table). As a result, InboxPage's thread-list query
-- selects a nonexistent column, which PostgREST rejects outright — the
-- whole Inbox page currently fails to load.
--
-- Existing RLS policies (nmt_self, nm_self) already use FOR ALL, so they
-- cover the UPDATE these soft-deletes perform — no new policies needed.

ALTER TABLE public.navi_message_threads
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient  boolean NOT NULL DEFAULT false;

ALTER TABLE public.navi_messages
  ADD COLUMN IF NOT EXISTS deleted_by_sender    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_recipient  boolean NOT NULL DEFAULT false;
