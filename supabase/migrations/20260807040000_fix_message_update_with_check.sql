-- navi_messages and direct_messages UPDATE policies had a USING clause
-- (which rows can be targeted) but no WITH CHECK (what the row can be
-- changed to) — a participant could update their own message row into a
-- state that violates the same ownership condition, e.g. reassigning it
-- into a thread they don't belong to.
ALTER POLICY "Users update their own direct messages" ON direct_messages
  WITH CHECK ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

ALTER POLICY "Participants can update messages" ON navi_messages
  WITH CHECK (EXISTS (
    SELECT 1 FROM navi_message_threads t
    WHERE t.id = navi_messages.thread_id AND (t.sender_user_id = auth.uid() OR t.receiver_user_id = auth.uid())
  ));
