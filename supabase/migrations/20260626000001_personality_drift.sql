-- personality_session_scores
-- Records which personality traits were dominant in each chat session
-- and whether the session correlated with positive operator outcomes.
CREATE TABLE IF NOT EXISTS personality_session_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Scores for each personality type (0-100, sum may exceed 100 — not exclusive)
  guardian_score   SMALLINT DEFAULT 0,
  hype_score       SMALLINT DEFAULT 0,
  rogue_score      SMALLINT DEFAULT 0,
  shadow_score     SMALLINT DEFAULT 0,
  sage_score       SMALLINT DEFAULT 0,
  companion_score  SMALLINT DEFAULT 0,
  analytical_score SMALLINT DEFAULT 0,
  wildcard_score   SMALLINT DEFAULT 0,
  strategist_score SMALLINT DEFAULT 0,
  mentor_score     SMALLINT DEFAULT 0,
  -- Outcome signals (populated by trigger-engine or end-of-session hook)
  messages_in_session     SMALLINT DEFAULT 0,
  quests_completed_after  SMALLINT DEFAULT 0,  -- within 2h after session
  bond_delta              SMALLINT DEFAULT 0,  -- net bond change during session
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pss_user_date
  ON personality_session_scores(user_id, session_date DESC);

-- personality_drift_config
-- Controls how fast drift happens and what the current dominant personality is.
CREATE TABLE IF NOT EXISTS personality_drift_config (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_personality  TEXT NOT NULL DEFAULT 'GUARDIAN',
  drift_personality TEXT,
  drift_confidence  NUMERIC(4,2) DEFAULT 0,
  last_computed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a row for every existing user
INSERT INTO personality_drift_config (user_id, base_personality)
SELECT id, COALESCE(navi_personality, 'GUARDIAN')
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- RLS
ALTER TABLE personality_session_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_drift_config    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_pss" ON personality_session_scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_pdc" ON personality_drift_config
  FOR ALL USING (auth.uid() = user_id);
