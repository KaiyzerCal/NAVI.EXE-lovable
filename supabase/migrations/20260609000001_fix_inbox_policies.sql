-- Add missing UPDATE policy for navi_messages (required by soft-delete).
-- The original migration only created SELECT and INSERT policies;
-- without UPDATE, deleteMessage() silently fails in the UI.

DROP POLICY IF EXISTS "Participants can update messages" ON public.navi_messages;

CREATE POLICY "Participants can update messages"
  ON public.navi_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.navi_message_threads t
      WHERE t.id = navi_messages.thread_id
        AND (t.sender_user_id = auth.uid() OR t.receiver_user_id = auth.uid())
    )
  );
