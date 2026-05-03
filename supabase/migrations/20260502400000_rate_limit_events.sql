-- Rate limiting infrastructure for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id         bigserial   PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_events_user_route_created_at_idx
  ON public.rate_limit_events (user_id, route, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can insert own rate limit events"
    ON public.rate_limit_events FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own rate limit events"
    ON public.rate_limit_events FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
