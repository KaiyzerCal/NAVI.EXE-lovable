# NAVI.EXE — Claude Code Notes

## Backend: Lovable

**This app's backend is Lovable-managed** (Calvin, 2026-08-21). Same for the
Vantara app (`mythos-vantara` / CODEXOS / Mavis). Consequences that matter
every session:

- The Supabase project (`fjkkcrmhptrzobajjsqg`, per `supabase/config.toml`) is
  provisioned *through Lovable*, so it does NOT appear in Calvin's own Supabase
  org — the Supabase MCP's `list_projects` will not return it. Reach the live
  DB through the **Lovable MCP** (`query_database`) instead, against the
  Lovable project rather than the Supabase ref.
- Schema and storage changes land via Lovable, not `supabase db push` from this
  repo. A file in `supabase/migrations/` is not applied just because it is
  committed — assume it is NOT live until confirmed against the running DB.
- Lovable writes back to the GitHub repo. A branch pushed from here and an edit
  made in the Lovable editor can diverge; check which side is authoritative
  before assuming a local push reached the running app.
- The README already reflects this: Stripe runs through "the Lovable connector
  gateway" and chat/embeddings through "the Lovable AI gateway".

### Likely Lovable project — confirm before acting

Workspace "Cal's Lovable" (`ggIVIJ8dhqNxDaOjtFhU`) → **mavislitenavi** /
"Mavis Lite Core" (`8fada453-44c4-4213-a8f4-afbeaf21de89`,
https://mavislitenavi.lovable.app).

Evidence: the name contains "navi"; the Lovable description matches this app
(chat assistant, file/photo/video gallery, Stripe edge functions); and its
latest build id `b003b154` matches this repo's HEAD commit `b003b15`.

Against it: the project's recorded git URL is `rork-mavis-lite.git`, not
`NAVI.EXE-lovable` — probably a rename, but **verify the mapping before
treating it as settled.**
