
-- Equipment table
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  slot text NOT NULL DEFAULT 'accessory',
  rarity text NOT NULL DEFAULT 'common',
  stat_bonuses jsonb NOT NULL DEFAULT '{}',
  buff_id uuid,
  is_equipped boolean NOT NULL DEFAULT false,
  obtained_at timestamp with time zone NOT NULL DEFAULT now(),
  obtained_from text NOT NULL DEFAULT 'manual'
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own equipment" ON public.equipment FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Buffs table
CREATE TABLE public.buffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  effect_type text NOT NULL DEFAULT 'buff',
  stat_affected text NOT NULL DEFAULT '',
  modifier_value integer NOT NULL DEFAULT 0,
  duration_hours integer,
  source text NOT NULL DEFAULT 'manual',
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.buffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own buffs" ON public.buffs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add foreign key from equipment to buffs
ALTER TABLE public.equipment ADD CONSTRAINT equipment_buff_id_fkey FOREIGN KEY (buff_id) REFERENCES public.buffs(id) ON DELETE SET NULL;

-- Add quest reward columns
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS equipment_reward_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS buff_reward_id uuid REFERENCES public.buffs(id) ON DELETE SET NULL;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS debuff_penalty_id uuid REFERENCES public.buffs(id) ON DELETE SET NULL;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS loot_description text NOT NULL DEFAULT '';

-- Add subclass column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subclass text;
