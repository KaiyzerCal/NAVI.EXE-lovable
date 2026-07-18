# NAVI.EXE — Project Shard

> **Verified against `main` on 2026-07-17.** Every function, route, table, and
> constant below was confirmed present in the repository. Anything aspirational
> lives in [Planned / Not Yet Implemented](#planned--not-yet-implemented) at the
> bottom — **do not assume those exist**.
>
> **Agent note:** the `mythos-vantara` / MAVIS-CODEXOS shard describes a
> *different, larger* system. Its `mavis-*` functions, persona/council actions,
> and `telos` / `standing_orders` tables do **not** exist here. Do not route
> NAVI work against it.

---

## What It Is

Gamified life-companion app. The user's **NAVI** is an AI operator companion
that turns real-life goals into quests, awards XP, evolves visually as the user
levels up, and coaches them through an in-app chat. Includes journaling, guilds,
parties, skill trees, achievements, mini-games, a skin system, semantic memory,
push notifications, and a paid subscription tier (**Core Operator**).

⚠️ **Naming drift:** the app is branded NAVI.EXE, but the chat page component is
`MavisChat`, the primary chat route is `/mavis`, and `capacitor.config.ts` still
ships `appId: 'com.mavislite.app'` / `appName: 'Mavis-Lite'`. Expect "Mavis" and
"NAVI" to refer to the same companion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase — Postgres + RLS, Auth, Storage, Realtime, Deno Edge Functions |
| AI Chat | Lovable AI Gateway (`google/gemini-2.5-flash-preview`) → OpenAI fallback |
| AI Utility | OpenAI `gpt-4o-mini` (action extraction, quest gen), `gpt-4o` (media analysis), `text-embedding-3-small` (memory), `dall-e-3` (skins) |
| Web Search | Tavily — env var is **`Tavily_API`** (not `TAVILY_API_KEY`) |
| Payments | Stripe Embedded Checkout + Customer Portal |
| Mobile | Capacitor (`appId: com.mavislite.app`, iOS + Android) |
| Push | WebPush / VAPID (service worker) |
| Testing | Vitest (unit), Playwright (e2e) |
| Package manager | **npm only** (`package-lock.json`; Bun lockfiles removed) |

---

## Routes (from `src/App.tsx` — authoritative)

Auth gate: `App.tsx` renders `<AuthPage />` when `!user`. There is **no**
`/auth` route. All authed routes render inside `AppShell`.

| Route | Page |
|---|---|
| `/` | Index |
| `/navi` | NaviPage |
| `/mavis` | MavisChat — **the AI chat page** |
| `/character` | CharacterPage |
| `/quests` | QuestsPage |
| `/party` | PartyPage |
| `/journal` | JournalPage |
| `/stats` | StatsPage |
| `/games` | GamesPage |
| `/guild` | GuildPage |
| `/social` | SocialPage |
| `/inbox` | InboxPage |
| `/upgrade` | UpgradePage |
| `/agents` | AgentPage |
| `/search` | SearchPage |
| `/notifications` | NotificationsPage |
| `/settings` | SettingsPage |
| `/admin` | AdminPage — owner-only, server-gated |
| `*` | NotFound |

**Orphaned pages** (files exist, no route — do not link to them):
`Dashboard.tsx`, `SkinsPage.tsx`, `CheckoutReturn.tsx`.
Skins UI is reachable through `CharacterPage`.

---

## Repository Layout

```
src/
  App.tsx                     # Routes, auth gate, AppShell
  contexts/
    AuthContext.tsx           # session, user, loading, signOut
    AppDataContext.tsx        # Central aggregator — profile, quests, journal, skills
    FeedContext.tsx           # operator_feed CRUD + realtime
  hooks/
    useProfile · useQuests · useJournal · useAchievements
    useSkillsAndEquipment · useSubscription · usePaywall
    useGuild · useParty · useNotifications · useUnreadMessages
    useOwner            # ← server-verified owner check via has_role() RPC
    useNaviRenderMode · useStripeCheckout · use-mobile · use-toast
  lib/
    xpSystem.ts               # XP formula, level math, progress%
    classEvolution.ts         # 5 evolution tiers + colors
    subclassRules.ts          # MBTI subclass mapping
    chatService.ts            # getOrCreateConversation, loadMessages, saveMessage
    memoryEngine.ts           # Client-side regex extraction + buildMemoryContext()
    naviActions.ts            # parseActions() + executeAction()
    naviSkillUnlocks.ts       # 11 level-gated system-prompt additions
    skinUnlockSystem.ts       # 71 skin defs, isSkinUnlocked()
    achievementDefinitions.ts # 43 achievement defs with check()
    stripe.ts                 # Stripe.js init, sandbox/live detection

supabase/
  config.toml
  functions/
    _shared/{auth,cors,stripe}.ts
    navi-chat · navi-actions · navi-analyze-media
    navi-embed-memories · navi-consolidate-memories
    navi-generate-daily-quests · navi-generate-skin
    send-push-notification · daily-reminders
    stripe-webhook · payments-webhook
    create-checkout · create-checkout-session · create-portal-session
    set-product-tax-codes · admin
  migrations/                 # 53 .sql files
```

---

## Edge Functions (17 dirs incl. `_shared` — authoritative)

### `navi-chat` — Primary AI chat (streaming SSE)
- **Auth:** `getAuthedUser()` — userId from JWT only; `context.user_id` in the
  body is ignored.
- **Rate limit:** free tier = **50 messages/day** (`FREE_LIMIT = 50`) → HTTP 402.
  Tracked on `profiles.daily_message_count` / `daily_message_reset_at`.
- **Per request:** Tavily search (`Tavily_API`) + `text-embedding-3-small` →
  `search_navi_memories` RPC (threshold 0.72, top 8).
- **System prompt** injects evolution state, personality block, app state
  (quests/skills/journal/buffs/equipment), level-gated skill unlocks, memory
  block, datetime.
- **Model:** Lovable Gateway `google/gemini-2.5-flash-preview` → OpenAI fallback.
- **Post-stream:** `extractActionsViaFunctionCalling` (gpt-4o-mini + NAVI_TOOLS)
  → emits `data: {"navi_actions": [...]}`; personality keyword scoring →
  `personality_session_scores`; updates `profiles.last_active`.
- **Env:** `LOVABLE_API_KEY`, `OPENAI_API`, `Tavily_API`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

**NAVI_TOOLS** (17 tools the chat model may call):
`create_quest`, `update_quest`, `complete_quest`, `delete_quest`,
`update_quest_progress`, `award_xp`, `create_journal`, `update_journal`,
`delete_journal`, `create_skill`, `update_skill`, `delete_skill`,
`create_buff`, `remove_buff`, `create_equipment`, `equip_item`,
`update_profile`.

### `navi-actions` — Server-side action executor
- Auth: JWT required; `userId` derived from token; service-role client.
- **27 action types:** the 17 above plus `create_subskill`, `update_subskill`,
  `delete_subskill`, `level_up_skill`, `update_buff`, `update_equipment`,
  `delete_equipment`, `unequip_item`, `use_streak_freeze`,
  `award_streak_freeze`.
- `complete_quest` awards XP (with level-up loop), currency by category,
  updates linked skill XP, logs to `activity_log`, posts to `operator_feed`,
  sends push.

### `navi-embed-memories` — Batch vector embedding
Fetches `navi_core_memory` rows where `embedding IS NULL` →
`text-embedding-3-small` (1536 dims) → patches `embedding`.

### `navi-consolidate-memories` — Dedup + summarize
High cosine similarity → delete duplicate; old low-importance rows →
`gpt-4o-mini` summary.

### `navi-analyze-media` — Vision analysis (`gpt-4o`)

### `navi-generate-daily-quests` — Cron daily quest generator (`gpt-4o-mini`)

### `navi-generate-skin` — `dall-e-3` skin generation, cached in Storage

### `send-push-notification` — WebPush via VAPID
Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

### `daily-reminders` — Hourly cron push notifications

### `stripe-webhook` / `payments-webhook` — Stripe event handlers
Both verify Stripe HMAC signatures; both run `verify_jwt = false` (a webhook
cannot carry a Supabase JWT — the signature *is* the auth). **Two webhook
handlers coexist; confirm which endpoint is configured in Stripe before
editing.**

### `create-checkout` — Stripe Embedded Checkout
Auth required; derives `userId` / `customer_email` from the JWT, **not** the
body. Validates `priceId` as alphanumeric. Returns `clientSecret`.

### `create-checkout-session` — **legacy duplicate** of `create-checkout`.
Not wired to the frontend (`StripeEmbeddedCheckout` calls `create-checkout`).
Candidate for deletion.

### `create-portal-session` — Stripe Customer Portal (auth required)

### `set-product-tax-codes` — One-time Stripe bootstrap; `requireOwner()` gated

### `admin` — Owner-only admin API
`requireOwner()` (JWT + `user_roles` check), service role.
Actions: `list` (users + feedback + reported), `toggle_beta`, `review_report`,
`ban_user`.

---

## Database

53 migrations. Tables confirmed created:

**User:** `profiles`, `user_roles`, `subscriptions`, `push_subscriptions`
**Gamification:** `quests`, `journal_entries`, `skills`, `subskills`,
`achievements`, `user_achievements`, `buffs`, `equipment`, `activity_log`
**Memory:** `navi_core_memory` (embedding vector 1536)
**Personality:** `personality_session_scores`
**Social:** `operator_feed`, `feed_replies`, `operator_follows`,
`social_posts`, `post_reactions`
**Messaging:** `navi_message_threads`, `navi_messages`, `direct_messages`
**Guild/Party:** `guilds`, `guild_members`, `guild_quests`, `parties`,
`party_members`
**Moderation:** `notifications`, `reported_content`, `beta_feedback`
**Economy:** `quest_packs`, `user_quest_packs`, `operator_quest_packs`,
`forge_balances`, `forge_transactions`
**Other:** `agent_tasks`, `agent_logs`, `chat_conversations`, `chat_messages`,
`virtual_spaces`, `space_quests`, `location_quests`, `location_checkins`,
`mini_game_scores`, `media`, `user_skins`, `user_unlocked_skins`,
`skin_unlock_conditions`, `rate_limits`, `rate_limit_events`, `vantara`

⚠️ **`direct_messages` is NOT legacy.** It is actively used by `App.tsx`,
`useUnreadMessages.ts`, and `DirectMessageModal` (rendered from
`OperatorProfileSheet`). It is missing from the generated
`src/integrations/supabase/types.ts`, which is the source of ~100 typecheck
errors. Fix by regenerating types, not by deleting the table.

### Key SQL functions / triggers
| Name | Purpose |
|---|---|
| `has_role(_user_id, _role)` | Core of all RLS + permission checks; backs `useOwner()` |
| `award_xp(_amount)` | RPC: adds XP, loops level-up, carries excess |
| `search_navi_memories(...)` | pgvector cosine + importance hybrid search |
| `check_profile_update_allowed()` | Trigger: blocks client writes to XP/coin/level columns |
| `has_active_subscription(uid)` | Returns boolean |
| `admin_list_users()` / `admin_toggle_beta()` / `admin_review_report()` | SECURITY DEFINER, owner-gated |

---

## Memory Pipeline (as actually implemented)

```
User message in MavisChat
  └─► [CLIENT] MavisChat.tsx extracts + INSERTs into navi_core_memory
        (memoryEngine.extractMemoriesFromMessage — regex based)

Background:
  ├─ navi-embed-memories      → fills NULL embedding columns
  └─ navi-consolidate-memories → dedup + summarize

Chat request:
  └─ embed(message) → search_navi_memories RPC → top 8
       └─ injected as [LONG-TERM MEMORY] block in system prompt
```

⚠️ Memory extraction is **client-side**, and the client writes
`navi_core_memory` rows directly. There is no server-side extraction function.

---

## XP / Leveling

Formula: `xpRequiredForLevel(L) = floor(50 × L × (L+1) / 2)`
- Level 1→2 = **50 XP** · 5→6 = 750 · 10→11 = 2,750
- Cap: level 100 (`xpRequiredForLevel(100) = Infinity`)

**Evolution tiers — 5 total** (`src/lib/classEvolution.ts`):

| Tier | Name | Levels |
|---|---|---|
| 1 | AWAKENING | 1–10 |
| 2 | ASCENDING | 11–25 |
| 3 | SOVEREIGN | 26–50 |
| 4 | TRANSCENDENT | 51–75 |
| 5 | LEGENDARY | 76–100 |

Currency on quest complete: `codex_points`, `cali_coins`.
Streaks: `current_streak`, `longest_streak`, `streak_freeze_count`.

---

## Personality System

**10 dimensions:** guardian, hype, rogue, shadow, sage, companion, analytical,
wildcard, strategist, mentor.

Per-session keyword scoring → `personality_session_scores`, used for the system
prompt personality block. (Automated weekly drift is **not** implemented — see
Planned.)

---

## Subscription Tiers (as implemented)

| Tier | Msg Limit |
|---|---|
| `free` | 50/day → HTTP 402 |
| non-free (**Core Operator**) | unlimited |

Code checks `subscription_tier !== "free"`. Stripe events set
`profiles.subscription_tier`. There is **no `elite` tier** in logic — the
`ELITE_FEATURES` list in `UpgradePage.tsx` is marketing copy.

---

## Skins

**71 skins**, categories + rarity tiers. Unlock conditions: `default`, `level`,
`navi_level`, `streak`, `quests`, `achievement`, `premium`, `elite`.
Owners (via `useOwner()`) bypass unlock conditions.
AI-generated via `dall-e-3`, cached in Supabase Storage.

**43 achievements** in `achievementDefinitions.ts`.

---

## NAVI Skill Unlocks (level-gated system-prompt additions)

Levels **5, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100** — 11 tiers
(Awareness → Recall → Overclock → Neural Link → Tactical Eye → Tactical Vision
→ Pattern Recognition → Resonance → Deep Bond → Autonomous Mode → Sovereign
Mode).

---

## Security Model

- **Identity:** every edge function derives the user ID from the verified
  Supabase JWT via `_shared/auth.ts → getAuthedUser()`. Request bodies are never
  trusted for identity.
- **Economy:** `check_profile_update_allowed` trigger blocks client writes to
  XP/coin/level columns; service role bypasses.
- **Admin:** server-side `has_role(uid, 'owner')`. The client-side
  `VITE_ADMIN_USER_IDS` / `@vantara.exe` check has been removed from all pages;
  UI uses the `useOwner()` hook, and all admin data access goes through the
  `admin` edge function with the service role.
- **CORS:** `_shared/cors.ts` echoes an origin only if listed in the
  `ALLOWED_ORIGINS` secret (comma-separated). Falls back to `*` when unset —
  always set it in production.
- **Payments:** `create-checkout` derives Stripe metadata from the JWT; webhooks
  verified via Stripe HMAC signature.
- **Reported content:** RLS locked to `has_role(uid, 'owner')`.

See `SECURITY.md` for detail.

---

## Environment Variables

**Client (`.env` — publishable only; file is untracked):**
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_PAYMENTS_CLIENT_TOKEN`, `VITE_SENTRY_DSN`

**Supabase function secrets (never client-exposed):**
`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API`, `LOVABLE_API_KEY`, **`Tavily_API`**,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `ALLOWED_ORIGINS`, `APP_URL`

⚠️ Exact casing matters: it is `OPENAI_API` (not `OPENAI_API_KEY`) and
`Tavily_API` (not `TAVILY_API_KEY`).

---

## Deploy Checklist

1. `supabase db push` — apply pending migrations
2. `supabase functions deploy`
3. Set function secrets (see above), including `ALLOWED_ORIGINS`
4. Grant admin:
   `INSERT INTO public.user_roles (user_id, role) VALUES ('<uuid>', 'owner');`
5. Stripe webhook endpoint →
   `https://fjkkcrmhptrzobajjsqg.supabase.co/functions/v1/stripe-webhook`
   (project ref `fjkkcrmhptrzobajjsqg`)
6. Regenerate DB types after schema changes:
   `supabase gen types typescript --project-id fjkkcrmhptrzobajjsqg > src/integrations/supabase/types.ts`

---

## Known Issues

1. **~100 typecheck errors** — `types.ts` is stale and missing `direct_messages`
   and other newer tables. Regenerate (step 6 above). Vite/esbuild still builds.
2. **Naming drift** — NAVI vs Mavis vs Vantara across routes, components, and
   the Capacitor `appId`.
3. **Duplicate functions** — `create-checkout` vs `create-checkout-session`;
   `stripe-webhook` vs `payments-webhook`.
4. **Orphaned pages** — `Dashboard.tsx`, `SkinsPage.tsx`, `CheckoutReturn.tsx`
   have no routes. `CheckoutReturn` being unrouted means Stripe's `return_url`
   has no page to land on — verify before launch.
5. **Test coverage is minimal** — one real unit suite (`xpSystem`, 7 tests).
6. **`.env` history** — the file is untracked now, but if a service-role or live
   Stripe key was ever committed, rotate and purge history (see `SECURITY.md`).

---

## Planned / Not Yet Implemented

**Nothing below exists in the codebase. Do not call, import, or reference it.**

| Item | Status |
|---|---|
| `navi-extract-memories` edge function | ❌ No dir, zero references. Extraction is client-side in `MavisChat.tsx`. |
| `navi-personality-drift` edge function | ❌ No dir. Session scores are recorded but never drift-computed. |
| `personality_drift_config` table | ❌ Zero references anywhere. |
| `navi-agent-runner` edge function | ❌ No dir — despite `agent_tasks`/`agent_logs` tables and the `/agents` route existing. |
| `complete_party_quest` RPC | ❌ Zero references. |
| `elite` subscription tier (2× rewards, gemini-2.5-pro) | ❌ Not in logic; free vs non-free only. |
| Routes `/dashboard` `/chat` `/profile` `/skills` `/skins` `/achievements` `/feed` `/store` `/leaderboard` `/forge` `/spaces` `/beta` `/auth` `/checkout/return` | ❌ Not registered in `App.tsx`. |
| `useInbox`, `useLeaderboard`, `usePushNotifications`, `useNotifications`, `UnreadMessagesContext` | ❌ Not present under those names (`useUnreadMessages` exists). |
| Native Capacitor push plugin | ❌ WebPush/service-worker only. |
| 20-tier class evolution | ❌ 5 tiers implemented. |
