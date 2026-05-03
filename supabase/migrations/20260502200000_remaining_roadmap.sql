-- =====================================================================
-- REMAINING ROADMAP: quest_packs, personality_session_scores,
-- rate_limits, vantara schema
-- =====================================================================

-- Quest packs catalogue
CREATE TABLE IF NOT EXISTS public.quest_packs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  name          text        NOT NULL,
  description   text,
  category      text        NOT NULL DEFAULT 'lifestyle',
  duration_days integer     NOT NULL DEFAULT 30,
  quest_count   integer     NOT NULL DEFAULT 10,
  forge_price   integer     NOT NULL DEFAULT 500,
  stripe_price_id text,
  quest_templates jsonb     NOT NULL DEFAULT '[]',
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Tracks which packs an operator has purchased / unlocked
CREATE TABLE IF NOT EXISTS public.operator_quest_packs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id         uuid        NOT NULL REFERENCES public.quest_packs(id),
  purchased_at    timestamptz NOT NULL DEFAULT now(),
  stripe_payment_id text,
  UNIQUE(user_id, pack_id)
);

ALTER TABLE public.operator_quest_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oqp_self" ON public.operator_quest_packs FOR ALL USING (auth.uid() = user_id);

-- Personality session scoring for adaptive drift
CREATE TABLE IF NOT EXISTS public.personality_session_scores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality text        NOT NULL,
  score       integer     NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personality_session_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pss_self" ON public.personality_session_scores FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS pss_user_idx ON public.personality_session_scores (user_id, created_at DESC);

-- Rate limits (may already exist — use IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start  timestamptz NOT NULL DEFAULT now(),
  request_count integer     NOT NULL DEFAULT 0
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rl_self" ON public.rate_limits FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS rl_user_window_idx ON public.rate_limits (user_id, window_start DESC);

-- ── VANTARA schema isolation ────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS vantara;

-- Revoke public access; only service_role can reach these tables
REVOKE ALL ON SCHEMA vantara FROM anon, authenticated;
GRANT USAGE ON SCHEMA vantara TO service_role;

CREATE TABLE IF NOT EXISTS vantara.mavis_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end   timestamptz,
  message_count integer     NOT NULL DEFAULT 0,
  personality_used text,
  metadata      jsonb       DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS vantara.prime_memory (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  content      text        NOT NULL,
  memory_type  text        NOT NULL,
  importance   integer     NOT NULL DEFAULT 3,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vantara.platform_analytics (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text        NOT NULL,
  user_id    uuid,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vantara.descent_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  event_type  text        NOT NULL,
  description text,
  severity    text        NOT NULL DEFAULT 'info',
  metadata    jsonb       DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed the three launch quest packs
INSERT INTO public.quest_packs (slug, name, description, category, duration_days, quest_count, forge_price, quest_templates)
VALUES
(
  'discipline-arc',
  'Discipline Arc',
  '30-day system-building arc. Build unbreakable daily habits across sleep, focus, and physical discipline.',
  'lifestyle',
  30,
  12,
  800,
  '[
    {"name":"Morning Protocol","description":"Wake at 6am. No phone for 30 mins. Hydrate, stretch, cold exposure.","type":"Daily","xp_reward":60},
    {"name":"Deep Work Block","description":"90-minute no-distraction work sprint. Phone off, notifications silenced.","type":"Daily","xp_reward":80},
    {"name":"Evening Shutdown","description":"Stop work at a fixed time. Write tomorrow''s three priorities.","type":"Daily","xp_reward":40},
    {"name":"Weekly Review","description":"Review last week: wins, misses, patterns. Adjust next week''s targets.","type":"Weekly","xp_reward":150},
    {"name":"Physical Standard","description":"30+ minutes of intentional movement every day for a week.","type":"Weekly","xp_reward":120},
    {"name":"No-Noise Day","description":"One full day with no social media, news, or passive content consumption.","type":"Weekly","xp_reward":100},
    {"name":"Sleep Fortress","description":"In bed by 10:30pm for 7 consecutive nights.","type":"Main","xp_reward":300},
    {"name":"Focus Streak","description":"Complete 20 deep work blocks without breaking protocol.","type":"Main","xp_reward":400},
    {"name":"The 30-Day Close","description":"Complete all daily quests for 30 consecutive days.","type":"Epic","xp_reward":1000},
    {"name":"Accountability Post","description":"Post your progress publicly to the feed. No hiding.","type":"Side","xp_reward":80},
    {"name":"Discipline Journal","description":"Write a reflection on what changed in you this month.","type":"Side","xp_reward":100},
    {"name":"Stack Assessment","description":"Audit your environment: remove everything that breaks focus.","type":"Side","xp_reward":60}
  ]'
),
(
  'entrepreneur-os',
  'Entrepreneur OS',
  '30-day founder operating system. Build the mental frameworks and daily rhythms of a serious operator.',
  'business',
  30,
  12,
  800,
  '[
    {"name":"Daily Revenue Check","description":"Spend 10 minutes reviewing revenue, pipeline, and key metrics every morning.","type":"Daily","xp_reward":60},
    {"name":"One Decision Made","description":"Make and document one significant business decision each day.","type":"Daily","xp_reward":70},
    {"name":"Network Touch","description":"Reach out to one person in your industry or target market.","type":"Daily","xp_reward":50},
    {"name":"Weekly Revenue Goal","description":"Set a concrete revenue or growth target at the start of each week.","type":"Weekly","xp_reward":100},
    {"name":"Competitor Audit","description":"Analyze one competitor every week — pricing, positioning, and gaps.","type":"Weekly","xp_reward":120},
    {"name":"Team Sync","description":"Hold a focused team or stakeholder check-in with clear agenda.","type":"Weekly","xp_reward":80},
    {"name":"MVP Shipped","description":"Ship something. Minimum viable, tested, in the hands of users.","type":"Main","xp_reward":500},
    {"name":"First Customer Conversation","description":"Have an unscripted conversation with a real customer or prospect.","type":"Main","xp_reward":300},
    {"name":"Operator OS","description":"Document your personal operating system: values, decision rules, weekly rhythms.","type":"Epic","xp_reward":1000},
    {"name":"Kill the Bottleneck","description":"Identify and eliminate the single biggest thing slowing your business.","type":"Side","xp_reward":150},
    {"name":"Offer Clarity","description":"Write your offer in one sentence that a stranger understands immediately.","type":"Side","xp_reward":100},
    {"name":"Monthly CEO Letter","description":"Write a letter to yourself about what you built this month and what''s next.","type":"Side","xp_reward":120}
  ]'
),
(
  'athletic-ascent',
  'Athletic Ascent',
  '30-day physical transformation arc. Build strength, conditioning, and the identity of an athlete.',
  'fitness',
  30,
  12,
  800,
  '[
    {"name":"Training Session","description":"Complete one full training session — lifting, conditioning, or sport.","type":"Daily","xp_reward":70},
    {"name":"Nutrition Logged","description":"Track everything you eat. No guessing. Full accountability.","type":"Daily","xp_reward":40},
    {"name":"Recovery Protocol","description":"Sleep 7-9 hours and spend 10 minutes on active recovery.","type":"Daily","xp_reward":50},
    {"name":"Weekly PRs","description":"Hit a personal record in at least one lift or conditioning metric this week.","type":"Weekly","xp_reward":150},
    {"name":"Body Composition Check","description":"Measure and document your body composition at the start of each week.","type":"Weekly","xp_reward":80},
    {"name":"Skill Development","description":"Dedicate one session this week to developing a new athletic skill.","type":"Weekly","xp_reward":100},
    {"name":"The Benchmark Test","description":"Complete a defined benchmark workout at the start and end of the arc to measure growth.","type":"Main","xp_reward":400},
    {"name":"Zero Miss Week","description":"Train every scheduled session for an entire week with no skips.","type":"Main","xp_reward":300},
    {"name":"Athletic Identity","description":"Complete all 30 days of the arc. You are an athlete.","type":"Epic","xp_reward":1000},
    {"name":"Meal Prep Sunday","description":"Prepare food for the full week ahead on Sunday.","type":"Side","xp_reward":80},
    {"name":"Coach or Mentor Session","description":"Train with or consult a coach, trainer, or more advanced athlete.","type":"Side","xp_reward":120},
    {"name":"Public Commitment","description":"Post your training goal and arc commitment to the operator feed.","type":"Side","xp_reward":60}
  ]'
)
ON CONFLICT (slug) DO NOTHING;
