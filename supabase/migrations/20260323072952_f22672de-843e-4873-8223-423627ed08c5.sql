
-- Table to track unlocked skins per user
CREATE TABLE public.user_unlocked_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skin_name TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlock_source TEXT NOT NULL DEFAULT 'manual',
  UNIQUE (user_id, skin_name)
);

-- Enable RLS
ALTER TABLE public.user_unlocked_skins ENABLE ROW LEVEL SECURITY;

-- Users can read their own unlocked skins
CREATE POLICY "Users can read own unlocked skins"
ON public.user_unlocked_skins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own unlocked skins
CREATE POLICY "Users can insert own unlocked skins"
ON public.user_unlocked_skins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Skin unlock conditions reference table
CREATE TABLE public.skin_unlock_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skin_name TEXT NOT NULL UNIQUE,
  unlock_type TEXT NOT NULL DEFAULT 'level',
  unlock_value INT NOT NULL DEFAULT 1,
  description TEXT
);

-- Public read for unlock conditions
ALTER TABLE public.skin_unlock_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read unlock conditions"
ON public.skin_unlock_conditions
FOR SELECT
TO authenticated
USING (true);
