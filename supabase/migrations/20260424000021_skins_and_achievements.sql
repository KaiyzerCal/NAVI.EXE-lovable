-- User-owned skins tracking
CREATE TABLE IF NOT EXISTS user_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skin_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skin_id)
);

ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_skins" ON user_skins
  FOR ALL USING (auth.uid() = user_id);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- Profile additions for achievement tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_messages integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quests_completed integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS journal_entries integer NOT NULL DEFAULT 0;

-- Mini-game scores (Phase 2-3)
CREATE TABLE IF NOT EXISTS mini_game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  score integer NOT NULL,
  metadata jsonb,
  played_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mini_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_scores" ON mini_game_scores
  FOR ALL USING (auth.uid() = user_id);

-- Index for leaderboards
CREATE INDEX IF NOT EXISTS mini_game_scores_game_score ON mini_game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_skins_user ON user_skins(user_id);
