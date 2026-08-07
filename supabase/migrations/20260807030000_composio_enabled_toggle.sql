-- Per-operator on/off switch for Composio real-world tool access. Having a
-- COMPOSIO_API_KEY configured makes the capability possible; this makes it
-- opt-in per operator rather than silently available to everyone the moment
-- the key exists.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS composio_enabled boolean NOT NULL DEFAULT false;
