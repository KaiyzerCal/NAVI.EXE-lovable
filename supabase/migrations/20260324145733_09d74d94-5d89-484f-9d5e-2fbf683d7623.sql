
CREATE TABLE public.navi_core_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'context',
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.navi_core_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memories" ON public.navi_core_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON public.navi_core_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON public.navi_core_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_navi_core_memory_user ON public.navi_core_memory(user_id, created_at DESC);
