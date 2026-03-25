
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'personal';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS importance text NOT NULL DEFAULT 'medium';
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS linked_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL;
