ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_evolution_tier integer NOT NULL DEFAULT 1;
