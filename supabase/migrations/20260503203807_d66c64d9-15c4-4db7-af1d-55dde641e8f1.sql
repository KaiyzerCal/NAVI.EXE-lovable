ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS personality_engagement_score integer NOT NULL DEFAULT 5;