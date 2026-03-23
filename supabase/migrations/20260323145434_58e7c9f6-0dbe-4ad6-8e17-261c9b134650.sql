
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS navi_name text NOT NULL DEFAULT 'NAVI',
  ADD COLUMN IF NOT EXISTS xp_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_navi_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Update default navi_personality to new system
UPDATE public.profiles SET navi_personality = 'GUARDIAN' WHERE navi_personality IN ('ANALYTICAL', 'CHEERFUL', 'STERN', 'PLAYFUL', 'MYSTERIOUS');
