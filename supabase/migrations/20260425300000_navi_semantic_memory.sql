-- Enable pgvector extension (no-op if already active)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to long-term memory
ALTER TABLE public.navi_core_memory
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat index for approximate cosine-similarity search.
-- lists = 50 is appropriate for up to ~500 k rows.
CREATE INDEX IF NOT EXISTS navi_core_memory_embedding_idx
  ON public.navi_core_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Semantic search function: weighted blend of cosine similarity (70%)
-- and declared importance (30%) so high-importance memories surface even
-- when they are not the closest vector match.
CREATE OR REPLACE FUNCTION public.search_navi_memories(
  p_user_id       uuid,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.70,
  match_count     int   DEFAULT 10
)
RETURNS TABLE(
  content      text,
  memory_type  text,
  importance   int,
  similarity   float
)
LANGUAGE sql STABLE AS $$
  SELECT
    content,
    memory_type,
    importance,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.navi_core_memory
  WHERE
    user_id = p_user_id
    AND embedding IS NOT NULL
    AND (1 - (embedding <=> query_embedding)) > match_threshold
  ORDER BY
    ((1 - (embedding <=> query_embedding)) * 0.7
      + (importance::float / 10.0) * 0.3) DESC
  LIMIT match_count;
$$;
