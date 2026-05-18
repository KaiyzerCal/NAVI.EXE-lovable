-- Shop items: extend buffs table with effect columns
ALTER TABLE IF EXISTS buffs
  ADD COLUMN IF NOT EXISTS effect_type text,
  ADD COLUMN IF NOT EXISTS effect_value numeric;

-- Profile extensions for shop
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS has_premium_frame boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guild_premium_banners boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{}'::jsonb;

-- Guild leveling
ALTER TABLE guilds
  ADD COLUMN IF NOT EXISTS guild_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guild_level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS vault_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weekly_xp integer DEFAULT 0;
