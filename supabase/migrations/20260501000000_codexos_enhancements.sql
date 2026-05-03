-- ============================================================
-- CodexOS Enhancement Migration
-- Rate limiting, personality drift, quest packs, Forge economy,
-- VANTARA schema isolation, ATLAS virtual spaces improvements
-- ============================================================

-- ── Rate Limits ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start  timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_user_window_idx
  ON public.rate_limits (user_id, window_start DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own rate limits" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Auto-cleanup: delete rows older than 2 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 hours';
$$;

-- ── Personality Drift — add columns to profiles ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personality_engagement_score int DEFAULT 5,
  ADD COLUMN IF NOT EXISTS personality_session_count    int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_tier            text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS daily_message_count          int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_message_reset_at       date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS timezone                     text DEFAULT 'UTC';

-- Reset daily_message_count each new day (function + trigger)
CREATE OR REPLACE FUNCTION public.reset_daily_message_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.daily_message_reset_at < current_date THEN
    NEW.daily_message_count := 0;
    NEW.daily_message_reset_at := current_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_daily_messages ON public.profiles;
CREATE TRIGGER trg_reset_daily_messages
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_daily_message_count();

-- ── Quest Packs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quest_packs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  description  text,
  theme        text DEFAULT 'general',
  price_cents  int NOT NULL DEFAULT 299,
  quest_count  int NOT NULL DEFAULT 0,
  quests       jsonb NOT NULL DEFAULT '[]',
  preview_tags text[] DEFAULT '{}',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active quest packs" ON public.quest_packs
  FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.user_quest_packs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id     uuid NOT NULL REFERENCES public.quest_packs(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_id)
);

ALTER TABLE public.user_quest_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quest pack purchases" ON public.user_quest_packs
  FOR ALL USING (auth.uid() = user_id);

-- Seed starter quest packs
INSERT INTO public.quest_packs (slug, title, description, theme, price_cents, quest_count, quests, preview_tags)
VALUES
  (
    '30-day-discipline',
    '30-Day Discipline Arc',
    'A 30-day progressive quest arc designed to build unbreakable daily habits. Start small, end unstoppable.',
    'discipline',
    299,
    30,
    '[
      {"name":"Day 1: Foundation","type":"Daily","total":1,"xp_reward":25,"description":"Complete one focused task today without distraction."},
      {"name":"Day 2: Wake Early","type":"Daily","total":1,"xp_reward":25,"description":"Wake up 30 minutes earlier than usual."},
      {"name":"Day 3: Move Your Body","type":"Daily","total":1,"xp_reward":30,"description":"30 minutes of physical activity."},
      {"name":"Day 7: Week 1 Review","type":"Weekly","total":1,"xp_reward":100,"description":"Reflect on week one. What patterns are forming?"},
      {"name":"Day 14: Mid-Arc Assessment","type":"Side","total":1,"xp_reward":150,"description":"Halfway point. Evaluate progress and adjust."},
      {"name":"Day 30: Arc Complete","type":"Main","total":1,"xp_reward":500,"description":"You completed the 30-Day Discipline Arc. Document what changed."}
    ]',
    '{"discipline","habits","daily","self-improvement"}'
  ),
  (
    'entrepreneur-os',
    'Entrepreneur OS',
    'A business-focused quest system for founders and operators. Build systems, close deals, grow your operation.',
    'business',
    499,
    20,
    '[
      {"name":"Define Your Core Offer","type":"Main","total":1,"xp_reward":200,"description":"Write one clear sentence describing what you sell and who it is for."},
      {"name":"Map Your Customer Journey","type":"Main","total":3,"xp_reward":300,"description":"Document the awareness, decision, and conversion stages for your ideal customer."},
      {"name":"Weekly Revenue Review","type":"Weekly","total":1,"xp_reward":150,"description":"Review income, expenses, and pipeline every week."},
      {"name":"Content Creation Sprint","type":"Weekly","total":5,"xp_reward":200,"description":"Create 5 pieces of content this week across any platform."},
      {"name":"Close 1 Deal","type":"Side","total":1,"xp_reward":500,"description":"Reach out, follow up, and close one sale this week."},
      {"name":"Build Your SOP Library","type":"Epic","total":10,"xp_reward":1000,"description":"Document 10 standard operating procedures for your business."}
    ]',
    '{"business","entrepreneur","revenue","systems"}'
  ),
  (
    'athletic-ascent',
    'Athletic Ascent',
    'A fitness quest arc that builds progressive physical challenges. Track movement, nutrition, and recovery.',
    'fitness',
    299,
    25,
    '[
      {"name":"Morning Movement","type":"Daily","total":1,"xp_reward":40,"description":"Move your body for 20+ minutes every morning."},
      {"name":"Hydration Protocol","type":"Daily","total":1,"xp_reward":20,"description":"Drink 2L of water today."},
      {"name":"Weekly Distance Goal","type":"Weekly","total":1,"xp_reward":150,"description":"Complete 20km of movement this week (run, walk, bike, swim)."},
      {"name":"Strength Foundation","type":"Main","total":12,"xp_reward":600,"description":"Complete 12 strength training sessions this month."},
      {"name":"Race Day","type":"Epic","total":1,"xp_reward":1000,"description":"Complete a race, challenge, or athletic event."}
    ]',
    '{"fitness","health","athletic","movement"}'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Forge Economy ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forge_balances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    int NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forge_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own forge balance" ON public.forge_balances
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.forge_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount           int NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'refund')),
  description      text NOT NULL DEFAULT '',
  reference_id     text,
  balance_after    int,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forge_transactions_user_idx
  ON public.forge_transactions (user_id, created_at DESC);

ALTER TABLE public.forge_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own forge transactions" ON public.forge_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages forge transactions" ON public.forge_transactions
  FOR ALL USING (true);

-- ── ATLAS / Virtual Spaces ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_spaces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  domain       text NOT NULL CHECK (domain IN ('career', 'health', 'mind', 'social', 'finance', 'custom')),
  description  text,
  level        int NOT NULL DEFAULT 1,
  xp           int NOT NULL DEFAULT 0,
  theme_color  text DEFAULT 'primary',
  is_unlocked  boolean NOT NULL DEFAULT true,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own virtual spaces" ON public.virtual_spaces
  FOR ALL USING (auth.uid() = user_id);

-- Function to auto-create default virtual spaces for new operators
CREATE OR REPLACE FUNCTION public.create_default_atlas_spaces(p_user_id uuid)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO public.virtual_spaces (user_id, name, domain, description)
  VALUES
    (p_user_id, 'Career Command', 'career', 'Work, income, business, and professional growth'),
    (p_user_id, 'Health Matrix', 'health', 'Fitness, wellness, nutrition, and physical performance'),
    (p_user_id, 'Mind Palace', 'mind', 'Learning, knowledge, mental clarity, and creative work'),
    (p_user_id, 'Social Node', 'social', 'Relationships, community, networking, and collaboration'),
    (p_user_id, 'Finance Hub', 'finance', 'Budget, investments, savings, and financial operations')
  ON CONFLICT DO NOTHING;
$$;

-- ── VANTARA Schema — MAVIS-PRIME isolation ────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS vantara;

-- Revoke all public access on vantara schema
REVOKE ALL ON SCHEMA vantara FROM PUBLIC;
REVOKE ALL ON SCHEMA vantara FROM anon;
REVOKE ALL ON SCHEMA vantara FROM authenticated;

-- MAVIS-PRIME sessions (service role only)
CREATE TABLE IF NOT EXISTS vantara.mavis_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type text NOT NULL DEFAULT 'prime',
  context_json jsonb DEFAULT '{}',
  model_used   text,
  tokens_in    int DEFAULT 0,
  tokens_out   int DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- MAVIS-PRIME memory (separate from NAVI consumer memory)
CREATE TABLE IF NOT EXISTS vantara.prime_memory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type  text NOT NULL,
  content      text NOT NULL,
  importance   int NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  tags         text[] DEFAULT '{}',
  embedding    vector(1536),
  source       text DEFAULT 'prime',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Platform analytics (PRIME sees the whole NAVI platform)
CREATE TABLE IF NOT EXISTS vantara.platform_analytics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name  text NOT NULL,
  metric_value numeric,
  metadata     jsonb DEFAULT '{}',
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

-- Descent log — when MAVIS-PRIME acts in the NAVI world
CREATE TABLE IF NOT EXISTS vantara.descent_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type  text NOT NULL,
  target_user_id uuid,
  payload      jsonb DEFAULT '{}',
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS virtual_spaces_user_domain_idx
  ON public.virtual_spaces (user_id, domain);

CREATE INDEX IF NOT EXISTS quest_packs_theme_idx
  ON public.quest_packs (theme) WHERE is_active = true;
