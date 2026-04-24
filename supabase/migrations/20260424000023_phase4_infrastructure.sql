-- ── LOCATION QUESTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100,
  xp_reward integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'completed'
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS location_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES location_quests(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  note text,
  checked_in_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE location_quests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "location_quests_self"   ON location_quests   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "location_checkins_self" ON location_checkins FOR ALL USING (auth.uid() = user_id);

-- ── FORGE TOKEN ECONOMY ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forge_balances (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forge_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive = earn, negative = spend
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forge_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forge_balances_self"     ON forge_balances     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "forge_transactions_self" ON forge_transactions FOR ALL USING (auth.uid() = user_id);

-- Auto-create forge balance for new profiles
CREATE OR REPLACE FUNCTION create_forge_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO forge_balances (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_create_forge ON profiles;
CREATE TRIGGER on_profile_create_forge
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_forge_balance();

-- ── AGENT FRAMEWORK ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  agent_type text NOT NULL DEFAULT 'general', -- 'general' | 'quest' | 'research' | 'scheduler'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  priority integer NOT NULL DEFAULT 1,
  result text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  log_level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_tasks_self" ON agent_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_logs_self"  ON agent_logs  FOR ALL USING (
  EXISTS (SELECT 1 FROM agent_tasks WHERE id = task_id AND user_id = auth.uid())
);

-- ── VIRTUAL SPACES (ATLAS) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS virtual_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  theme text NOT NULL DEFAULT 'default',
  config jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS space_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES virtual_spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  quest_type text NOT NULL DEFAULT 'explore',
  xp_reward integer NOT NULL DEFAULT 25,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE virtual_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_quests   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "virtual_spaces_self"   ON virtual_spaces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "virtual_spaces_public" ON virtual_spaces FOR SELECT USING (is_public = true);
CREATE POLICY "space_quests_self"     ON space_quests   FOR ALL USING (
  EXISTS (SELECT 1 FROM virtual_spaces WHERE id = space_id AND user_id = auth.uid())
);

-- ── INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS agent_tasks_user   ON agent_tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_logs_task    ON agent_logs(task_id, created_at ASC);
CREATE INDEX IF NOT EXISTS forge_txn_user     ON forge_transactions(user_id, created_at DESC);
