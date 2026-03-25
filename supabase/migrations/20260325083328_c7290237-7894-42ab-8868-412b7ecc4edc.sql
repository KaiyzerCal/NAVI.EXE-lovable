
-- Create media table
CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  ai_description TEXT,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own media"
  ON public.media
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create mavis-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mavis-media', 'mavis-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'mavis-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'mavis-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read public media"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'mavis-media');

CREATE POLICY "Users can delete own media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'mavis-media' AND (storage.foldername(name))[1] = auth.uid()::text);
