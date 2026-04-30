-- Wave 2 foundations: moderation, streak freeze, quest templates, edge rate limit tracking

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_freeze_awarded_at timestamptz;

CREATE TABLE IF NOT EXISTS public.quest_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text,
  xp_reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Quest templates readable by authenticated users" ON public.quest_templates FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.quest_templates (category, name, description, xp_reward)
VALUES
  ('fitness', '30 Minute Walk', 'Complete a focused 30-minute walk.', 60),
  ('learning', 'Study Sprint', '25 minutes of focused learning.', 70),
  ('business', 'Deep Work Block', 'Complete one 45-minute deep work session.', 80),
  ('relationships', 'Meaningful Check-in', 'Send one thoughtful message to someone important.', 50),
  ('creativity', 'Creative Output', 'Ship one small creative artifact today.', 75)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reported_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.reported_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can insert reports" ON public.reported_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own reports" ON public.reported_content FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_events_user_route_created_at_idx
ON public.rate_limit_events (user_id, route, created_at DESC);
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can insert own rate limit events" ON public.rate_limit_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own rate limit events" ON public.rate_limit_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
