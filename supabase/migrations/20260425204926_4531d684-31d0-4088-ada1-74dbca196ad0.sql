-- 1. Add per-user persistent navi render mode to profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS navi_render_mode text NOT NULL DEFAULT 'SVG';

-- 2. Trigger to auto-bump recipient unread + last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION public.bump_thread_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_sender uuid;
  t_receiver uuid;
BEGIN
  SELECT sender_user_id, receiver_user_id
    INTO t_sender, t_receiver
  FROM public.navi_message_threads
  WHERE id = NEW.thread_id;

  IF t_sender IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bump unread for the OTHER participant (the one who didn't send this message),
  -- and refresh last_message_at, and un-delete the thread for the recipient
  -- so a new incoming message resurrects the conversation.
  IF NEW.sender_user_id = t_sender THEN
    UPDATE public.navi_message_threads
       SET receiver_unread = COALESCE(receiver_unread, 0) + 1,
           last_message_at = now(),
           deleted_by_recipient = false
     WHERE id = NEW.thread_id;
  ELSE
    UPDATE public.navi_message_threads
       SET sender_unread = COALESCE(sender_unread, 0) + 1,
           last_message_at = now(),
           deleted_by_sender = false
     WHERE id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_thread_on_new_message ON public.navi_messages;
CREATE TRIGGER trg_bump_thread_on_new_message
AFTER INSERT ON public.navi_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_thread_on_new_message();

-- 3. Create message-attachments storage bucket (public for easy preview URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-attachments — only allow uploads under user's own folder
CREATE POLICY "Message attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can update message attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments');
