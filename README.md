# NAVI.EXE

A gamified life-companion app. Your **NAVI** is an AI operator that turns goals
into quests, awards XP, evolves visually as you level, and coaches you through an
in-app chat. Includes journaling, guilds/parties, mini-games, a skin system, and
a Core Operator subscription tier.

## Stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind, shadcn/ui, Framer Motion
- **Backend:** Supabase (Postgres + RLS, Auth, Edge Functions in Deno)
- **Payments:** Stripe (embedded checkout via the Lovable connector gateway)
- **Mobile:** Capacitor (iOS + Android)
- **AI:** Lovable AI gateway / OpenAI for chat, embeddings, and semantic memory
- **Tooling:** Vitest (unit), Playwright (e2e), Sentry, ESLint

## Getting started

```bash
npm install
cp .env.example .env      # fill in your Supabase + Stripe publishable values
npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |

> **Package manager:** this project standardizes on **npm** (`package-lock.json`).
> The Bun lockfiles were removed to avoid drift.

## Environment

Only publishable values belong in `.env` (they ship in the client bundle):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`,
and `VITE_PAYMENTS_CLIENT_TOKEN` (Stripe publishable key).

**All secrets** — the Supabase service-role key, Stripe secret/webhook keys, and
AI provider keys — live only in Supabase Edge Function secrets and are never
exposed to the client.

Set `ALLOWED_ORIGINS` (comma-separated) in your function secrets to lock CORS to
your real app origins in production, e.g.
`https://navi.example.com,http://localhost:5173`.

## Admin access

Admin is granted **server-side** by inserting an `owner` row for a user in
`public.user_roles`:

```sql
insert into public.user_roles (user_id, role)
values ('<the-user-uuid>', 'owner');
```

The admin panel calls the owner-gated `admin` edge function; there is no
client-side admin flag.

## Supabase

Edge functions live in `supabase/functions/`; database schema in
`supabase/migrations/`. Deploy with the Supabase CLI:

```bash
supabase functions deploy
supabase db push
```

After schema changes, regenerate `src/integrations/supabase/types.ts`:

```bash
supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts
```

## Security

See [SECURITY.md](./SECURITY.md) for the auth/authorization model and the
hardening applied to identity handling, admin access, payments, and CORS.
