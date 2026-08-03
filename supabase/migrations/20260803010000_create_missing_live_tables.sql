-- ============================================================
-- Create tables that exist in the migrations folder but were
-- never actually applied to the live database
-- ============================================================
-- Verified directly against the live project's REST API (fjkkcrmhptrzobajjsqg):
-- these 4 tables 404 even though sibling tables defined in the very same
-- migration files exist and work — so this isn't "a migration got skipped
-- wholesale," it's that these specific CREATE TABLE statements individually
-- never landed (most plausible if the original migrations were applied by
-- pasting SQL into the dashboard in chunks and one statement per chunk was
-- missed). All four are actively queried by real frontend features that are
-- currently broken as a result:
--   - operator_follows      → SearchPage.tsx follow/unfollow
--   - operator_quest_packs,
--     quest_packs           → UpgradePage.tsx's entire Quest Packs feature
--   - reported_content      → AdminPage.tsx content moderation
--
-- Recreated verbatim from their original source migrations:
--   operator_follows      — 20260424000022_social_layer.sql
--   quest_packs (+ operator_quest_packs) — 20260502200000_remaining_roadmap.sql
--     (the OTHER quest_packs definition, in 20260501000000_codexos_enhancements.sql,
--     uses incompatible column names — price_cents/theme/quests instead of
--     forge_price/category/quest_templates — and was never applied either;
--     this migration creates the version the frontend's QuestPack interface
--     actually expects)
--   reported_content       — 20260502100000_roadmap_systems.sql
--
-- 15 other tables from the migrations folder are also missing live
-- (agent_logs, forge_balances, forge_transactions, location_checkins,
-- location_quests, personality_session_scores, push_subscriptions,
-- rate_limit_events, rate_limits, space_quests, user_achievements,
-- user_skins, vantara, virtual_spaces) but nothing in src/ currently
-- queries them — left alone here since creating schema nothing uses yet
-- isn't this migration's job.

CREATE TABLE IF NOT EXISTS public.operator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.operator_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_read" ON public.operator_follows;
DROP POLICY IF EXISTS "follows_self" ON public.operator_follows;
CREATE POLICY "follows_read" ON public.operator_follows FOR SELECT USING (true);
CREATE POLICY "follows_self" ON public.operator_follows FOR ALL USING (auth.uid() = follower_id);

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
ALTER TABLE public.quest_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active quest packs" ON public.quest_packs;
CREATE POLICY "Anyone can view active quest packs" ON public.quest_packs
  FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.operator_quest_packs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id         uuid        NOT NULL REFERENCES public.quest_packs(id),
  purchased_at    timestamptz NOT NULL DEFAULT now(),
  stripe_payment_id text,
  UNIQUE(user_id, pack_id)
);
ALTER TABLE public.operator_quest_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oqp_self" ON public.operator_quest_packs;
CREATE POLICY "oqp_self" ON public.operator_quest_packs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reported_content (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text        NOT NULL,
  -- FEED_POST | DM | GUILD_POST | PROFILE | REPLY
  content_id   text        NOT NULL,
  reason       text,
  reviewed     boolean     NOT NULL DEFAULT false,
  action_taken text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reported_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own reports" ON public.reported_content;
DROP POLICY IF EXISTS "Authenticated read reported_content" ON public.reported_content;
DROP POLICY IF EXISTS "Authenticated update reported_content" ON public.reported_content;
CREATE POLICY "Users insert own reports"
  ON public.reported_content FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Authenticated read reported_content"
  ON public.reported_content FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Authenticated update reported_content"
  ON public.reported_content FOR UPDATE TO authenticated
  USING (true);
