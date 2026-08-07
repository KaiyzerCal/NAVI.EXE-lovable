---
name: navi-companion
description: Manage a NAVI.EXE operator's quests, journal, skills, and XP through the navi-agent-runner MCP server. Use when the user asks to create or track a quest, log a journal entry, record a skill, or award themselves XP inside NAVI.
---

# NAVI Companion — quest, journal & XP tools

Documents the MCP server exposed by
`supabase/functions/navi-agent-runner/index.ts` in the navi-exe repo.
Unlike VANTARA, NAVI is a **multi-user consumer app** — every tool call
is scoped to whichever user's access token authenticated the request.
There's no cross-user or admin capability here at all; each connection
only ever touches its own operator's data.

## Connecting

Endpoint: the deployed `navi-agent-runner` function URL, Streamable
HTTP MCP transport (JSON-RPC 2.0 over POST). Auth: `Authorization:
Bearer <token>` — the same Supabase access token the NAVI web/mobile
app itself uses after sign-in. Get it from your own session (Settings
→ dev tools, or wherever the app is signed in) — there's no separate
API-key system, this reuses the real user session.

Standard handshake: `initialize` → `tools/list` → `tools/call`.

## Tools

- **create_quest** / **create_or_update_quest** — `create_or_update_quest`
  is idempotent (matches an existing quest by name and updates it rather
  than creating a duplicate) — prefer it over `create_quest` unless the
  user explicitly wants a second, distinct quest with the same name.
  `type` must be one of `Daily | Weekly | Main | Side | Minor | Epic`.
- **award_xp** — grants XP directly with no cap or validation against
  what the user actually did. Only call this in direct response to a
  real accomplishment the user described — never speculatively, and
  never larger amounts than what a comparable in-app quest would award
  (tens to low hundreds, not thousands).
- **create_journal** — `category` is one of
  `personal | business | legal | evidence | achievement`,
  `importance` is one of `low | medium | high | critical`. Both title
  and content are required.
- **create_skill** — `category` is one of
  `General | Combat | Knowledge | Social | Fitness | Creative | Technical`.

## Real-world tools (Composio)

When `COMPOSIO_API_KEY` is configured for this project, three extra tools
become available: `composio_search_tools`, `composio_execute_action`, and
`composio_connect_account`. These act on the operator's own connected
accounts (Gmail, Slack, Notion, GitHub, calendars, etc.) — not NAVI's own
data. If `composio_execute_action` fails because nothing's connected yet,
call `composio_connect_account` and hand the operator the resulting link
rather than giving up silently. Not live-tested against a real Composio
account as of this writing — treat unexpected errors from these three as
worth surfacing plainly, not retrying blindly.

## Behavior notes

- This is the operator's actual game-progression data — treat XP and
  quest creation as real, not cosmetic. Don't create quests or award XP
  as a side effect of casual conversation; only when the user is clearly
  asking for tracking, not just chatting about their day.
- If a tool call's result text says "Failed to create..." or "Failed to
  award...", surface that plainly rather than telling the user it
  succeeded — the tool has no automatic retry.
