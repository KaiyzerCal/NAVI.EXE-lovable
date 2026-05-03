-- Unread message counters (per user per thread)
ALTER TABLE navi_message_threads ADD COLUMN IF NOT EXISTS sender_unread integer NOT NULL DEFAULT 0;
ALTER TABLE navi_message_threads ADD COLUMN IF NOT EXISTS receiver_unread integer NOT NULL DEFAULT 0;

-- Track sender as user_id so trigger can route unread correctly
ALTER TABLE navi_messages ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES profiles(id);

-- File/image/video attachments on messages
ALTER TABLE navi_messages ADD COLUMN IF NOT EXISTS attachment_url  text;
ALTER TABLE navi_messages ADD COLUMN IF NOT EXISTS attachment_type text; -- 'image' | 'video' | 'file'
ALTER TABLE navi_messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- Trigger: auto-increment the recipient's unread counter on each new message
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

-- Storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
  VALUES ('message-attachments', 'message-attachments', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "message_attach_upload" ON storage.objects;
DROP POLICY IF EXISTS "message_attach_read"   ON storage.objects;

CREATE POLICY "message_attach_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "message_attach_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');
