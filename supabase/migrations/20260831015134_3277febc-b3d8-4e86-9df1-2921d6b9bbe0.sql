-- Semantic search over journal entries and quests.
--
-- Keyword search (appSearch.ts, shipped separately) finds entries that share
-- words with the question. It cannot connect "that thing with my knee" to a
-- journal entry titled "Physio follow-up notes". NAVI already has exactly
-- this problem solved once, for navi_core_memory
-- (20260425300000_navi_semantic_memory.sql) — this repeats that pattern for
-- the two tables in the new keyword registry with the richest, most
-- paraphrase-prone prose: journal_entries and quests. The rest of that
-- registry (skills, achievements, chat, etc.) stays keyword-only; short
-- labels and structured fields don't benefit from an embedding the way a
-- paragraph of journal prose or a quest description does.
--
-- vector(1536) matches every embedding call already in this codebase
-- (navi-chat, navi-embed-memories both call text-embedding-3-small with no
-- `dimensions` override, i.e. its native width) — no legacy narrow-width
-- table to work around here, unlike mythos-vantara's mavis_persona_memory.
--
-- Same safety rules as every migration in mythos-vantara's equivalent work:
--  1. lock_timeout set transaction-locally, not via session-level SET.
--  2. Nothing references auth.users.
--  3. Re-runnable: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE.
--  4. ADD COLUMN with no default/NOT NULL is catalogue-only in PG11+.
--
-- No vector index: both tables are per-operator and small (tens to low
-- hundreds of rows for any single user), so a sequential scan is already
-- instant. navi_core_memory's ivfflat index exists because that table can
-- reach hundreds of thousands of rows across users; these two are scoped by
-- user_id in every query and never approach that.

BEGIN;
SELECT set_config('lock_timeout', '3s', true);
SELECT set_config('statement_timeout', '60s', true);

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.quests          ADD COLUMN IF NOT EXISTS embedding vector(1536);

COMMIT;

-- Named search_navi_records rather than match_operator_entries, matching
-- this codebase's own verb (search_navi_memories) rather than importing
-- mythos-vantara's naming. Same shape as that function otherwise: kind
-- distinguishes which table a hit came from, title/body columns differ per
-- table so each branch names its own, p_scope narrows to one table or
-- searches both.
CREATE OR REPLACE FUNCTION public.search_navi_records(
  p_user_id uuid, p_query vector(1536), p_count int DEFAULT 8, p_scope text DEFAULT 'all'
)
RETURNS TABLE (kind text, id uuid, title text, content text,
               created_at timestamptz, similarity double precision)
LANGUAGE sql STABLE AS $$
  SELECT * FROM (
    SELECT 'journal'::text AS kind, j.id AS id, j.title AS title, j.content AS content,
           j.created_at AS created_at,
           1 - (j.embedding <=> p_query) AS similarity
    FROM public.journal_entries j
    WHERE j.user_id = p_user_id AND j.embedding IS NOT NULL AND p_scope IN ('all','journal')
    UNION ALL
    SELECT 'quests'::text, q.id, q.name, q.description,
           q.created_at,
           1 - (q.embedding <=> p_query)
    FROM public.quests q
    WHERE q.user_id = p_user_id AND q.embedding IS NOT NULL AND p_scope IN ('all','quests')
  ) hits
  ORDER BY hits.similarity DESC
  LIMIT greatest(p_count, 0);
$$;