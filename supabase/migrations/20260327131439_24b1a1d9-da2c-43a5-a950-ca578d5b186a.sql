
-- Add missing columns to achievements
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS unlocked_at timestamptz;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS threshold integer;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS icon text DEFAULT '★';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'COMMON';
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS operator_level integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS operator_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

-- Create handle_updated_at function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
