-- ============================================================
-- mavis-media was a public bucket with folder-per-user naming used
-- only as an organizational convention, not real access control: the
-- SELECT policy ("Anyone can read public media") had no ownership
-- check, so any journal attachment URL — including ones filed under
-- the "legal"/"evidence" journal categories — was readable by anyone
-- who obtained the URL, regardless of who uploaded it.
-- ============================================================

-- An owner-scoped SELECT policy ("Users can read own media") already
-- exists — it was just shadowed by the bucket being public (which lets
-- storage serve objects straight from the CDN, bypassing RLS) and by
-- this redundant blanket-read policy sitting alongside it.
UPDATE storage.buckets SET public = false WHERE id = 'mavis-media';

DROP POLICY IF EXISTS "Anyone can read public media" ON storage.objects;
