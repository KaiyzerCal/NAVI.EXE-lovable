
-- ENUM
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  bond_affection integer NOT NULL DEFAULT 50,
  bond_trust integer NOT NULL DEFAULT 50,
  bond_loyalty integer NOT NULL DEFAULT 50,
  navi_level integer NOT NULL DEFAULT 1,
  xp_total integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  notification_settings jsonb NOT NULL DEFAULT '{"dailySummary":true,"xpMilestones":false,"questReminders":true,"streakWarnings":true}'::jsonb,
  operator_level integer NOT NULL DEFAULT 1,
  operator_xp integer NOT NULL DEFAULT 0,
  onboarding_done boolean NOT NULL DEFAULT false,
  display_name text,
  equipped_skin text NOT NULL DEFAULT 'NETOP',
  character_class text,
  mbti_type text,
  navi_personality text NOT NULL DEFAULT 'ANALYTICAL',
  navi_name text NOT NULL DEFAULT 'NAVI',
  user_navi_description text,
  subclass text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- QUESTS
CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Daily',
  description text,
  progress integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 50,
  completed boolean NOT NULL DEFAULT false,
  loot_description text NOT NULL DEFAULT '',
  linked_skill_id uuid,
  equipment_reward_id uuid,
  buff_reward_id uuid,
  debuff_penalty_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own quests" ON public.quests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  level integer NOT NULL DEFAULT 1,
  max_level integer NOT NULL DEFAULT 10,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own skills" ON public.skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SUBSKILLS
CREATE TABLE IF NOT EXISTS public.subskills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.skills(id),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subskills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own subskills" ON public.subskills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- JOURNAL_ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'personal',
  importance text NOT NULL DEFAULT 'medium',
  xp_earned integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own journal entries" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  icon text DEFAULT '★',
  rarity text NOT NULL DEFAULT 'COMMON',
  source text NOT NULL DEFAULT 'system',
  threshold integer,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  xp integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own achievements" ON public.achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BUFFS
CREATE TABLE IF NOT EXISTS public.buffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  effect_type text NOT NULL DEFAULT 'buff',
  stat_affected text NOT NULL DEFAULT '',
  modifier_value integer NOT NULL DEFAULT 0,
  duration_hours integer,
  expires_at timestamptz,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.buffs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own buffs" ON public.buffs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EQUIPMENT
CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  slot text NOT NULL DEFAULT 'accessory',
  rarity text NOT NULL DEFAULT 'common',
  stat_bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  buff_id uuid REFERENCES public.buffs(id),
  is_equipped boolean NOT NULL DEFAULT false,
  obtained_from text NOT NULL DEFAULT 'manual',
  obtained_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own equipment" ON public.equipment FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CHAT_CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own conversations" ON public.chat_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id),
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- NAVI_CORE_MEMORY
CREATE TABLE IF NOT EXISTS public.navi_core_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  memory_type text NOT NULL DEFAULT 'context',
  importance integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.navi_core_memory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can insert own memories" ON public.navi_core_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own memories" ON public.navi_core_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own memories" ON public.navi_core_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MEDIA
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  ai_description text,
  linked_entity_id uuid,
  linked_entity_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own media" ON public.media FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ACTIVITY_LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  description text NOT NULL,
  xp_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own activity" ON public.activity_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USER_UNLOCKED_SKINS
CREATE TABLE IF NOT EXISTS public.user_unlocked_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skin_name text NOT NULL,
  unlock_source text NOT NULL DEFAULT 'manual',
  unlocked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_unlocked_skins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can insert own unlocked skins" ON public.user_unlocked_skins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own unlocked skins" ON public.user_unlocked_skins FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SKIN_UNLOCK_CONDITIONS
CREATE TABLE IF NOT EXISTS public.skin_unlock_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_name text NOT NULL,
  unlock_type text NOT NULL DEFAULT 'level',
  unlock_value integer NOT NULL DEFAULT 1,
  description text
);
ALTER TABLE public.skin_unlock_conditions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read unlock conditions" ON public.skin_unlock_conditions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

-- TRIGGER for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
