-- Social posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'update',
  reaction_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read posts"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users create own posts"
  ON public.social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts"
  ON public.social_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can bump reaction count"
  ON public.social_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users delete own posts"
  ON public.social_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_created ON public.social_posts(created_at DESC);

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Post reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL DEFAULT '⚡',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read reactions"
  ON public.post_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users add own reactions"
  ON public.post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions"
  ON public.post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);