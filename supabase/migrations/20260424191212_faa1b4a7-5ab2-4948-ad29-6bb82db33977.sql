ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_evolution_tier integer NOT NULL DEFAULT 1;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mbti_type text;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS character_class text;