-- Remove permissive reaction-count update policy
DROP POLICY IF EXISTS "Anyone authenticated can bump reaction count" ON public.social_posts;

-- Function to sync reaction_count from post_reactions
CREATE OR REPLACE FUNCTION public.sync_post_reaction_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
      SET reaction_count = reaction_count + 1
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
      SET reaction_count = GREATEST(0, reaction_count - 1)
      WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_reactions_count_sync ON public.post_reactions;
CREATE TRIGGER post_reactions_count_sync
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_reaction_count();