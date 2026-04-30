ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_evolution_tier integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS mbti_type text,
ADD COLUMN IF NOT EXISTS character_class text;
