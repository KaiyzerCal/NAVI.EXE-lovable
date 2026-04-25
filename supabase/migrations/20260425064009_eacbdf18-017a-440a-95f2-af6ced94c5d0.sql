-- Extend agent_tasks
ALTER TABLE public.agent_tasks
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Guild quests
CREATE TABLE IF NOT EXISTS public.guild_quests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  completed_by uuid,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guild_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guild members can view guild quests"
  ON public.guild_quests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guild_members gm
    WHERE gm.guild_id = guild_quests.guild_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Guild members can create guild quests"
  ON public.guild_quests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM public.guild_members gm
      WHERE gm.guild_id = guild_quests.guild_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Guild members can update guild quests"
  ON public.guild_quests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guild_members gm
    WHERE gm.guild_id = guild_quests.guild_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Quest creator can delete"
  ON public.guild_quests FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_guild_quests_guild ON public.guild_quests(guild_id, created_at DESC);

CREATE TRIGGER guild_quests_updated_at
  BEFORE UPDATE ON public.guild_quests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Navi message threads (DMs between users)
CREATE TABLE IF NOT EXISTS public.navi_message_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id uuid NOT NULL,
  receiver_user_id uuid NOT NULL,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.navi_message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view threads"
  ON public.navi_message_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);

CREATE POLICY "Users can create threads they participate in"
  ON public.navi_message_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_user_id);

CREATE POLICY "Participants can update threads"
  ON public.navi_message_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);

CREATE POLICY "Participants can delete threads"
  ON public.navi_message_threads FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);

CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.navi_message_threads(sender_user_id, receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON public.navi_message_threads(last_message_at DESC);

-- Navi messages within threads
CREATE TABLE IF NOT EXISTS public.navi_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  sender_user_id uuid NOT NULL DEFAULT auth.uid(),
  sender_navi_name text NOT NULL DEFAULT 'NAVI',
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.navi_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.navi_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.navi_message_threads t
    WHERE t.id = navi_messages.thread_id
      AND (t.sender_user_id = auth.uid() OR t.receiver_user_id = auth.uid())
  ));

CREATE POLICY "Participants can send messages"
  ON public.navi_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id AND EXISTS (
      SELECT 1 FROM public.navi_message_threads t
      WHERE t.id = navi_messages.thread_id
        AND (t.sender_user_id = auth.uid() OR t.receiver_user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_navi_messages_thread ON public.navi_messages(thread_id, created_at);