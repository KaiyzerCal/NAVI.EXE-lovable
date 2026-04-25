-- Add admin to app_role enum (must commit before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Add beta_tester flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_tester boolean NOT NULL DEFAULT false;

-- Mini game scores table
CREATE TABLE IF NOT EXISTS public.mini_game_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON public.mini_game_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON public.mini_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mini_game_scores_user ON public.mini_game_scores(user_id, game_id);

-- Beta feedback table
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feedback_type text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  app_version text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Agent tasks table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  agent_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent tasks"
  ON public.agent_tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON public.agent_tasks(user_id, created_at DESC);

CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();