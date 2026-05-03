-- Economy expansion: Cali/Codex pricing, purchased skins tracking

-- 1. Quest packs — add Cali + Codex pricing columns
ALTER TABLE public.quest_packs
  ADD COLUMN IF NOT EXISTS cali_price  integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS codex_price integer NOT NULL DEFAULT 0;

-- Update seeded pack prices
UPDATE public.quest_packs SET cali_price = 800,  codex_price = 60  WHERE slug = 'discipline-arc';
UPDATE public.quest_packs SET cali_price = 1200, codex_price = 100 WHERE slug = 'entrepreneur-os';
UPDATE public.quest_packs SET cali_price = 700,  codex_price = 50  WHERE slug = 'athletic-ascent';

-- 2. Profiles — track skins unlocked via Cali purchase
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS purchased_skin_ids text[] NOT NULL DEFAULT ARRAY[]::text[];

-- 3. Skin purchase prices by rarity (reference table, not enforced by DB)
-- UNCOMMON = 500 Cali, RARE = 1500 Cali, EPIC = 4000 Cali, LEGENDARY = 10000 Cali
-- These constants live in the client; the action handler validates spend.

-- 4. Ensure cali_coins and codex_points columns exist (may already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cali_coins   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS codex_points integer NOT NULL DEFAULT 0;
