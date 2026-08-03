# Fix access to the social / quest-pack / moderation tables

## What I found

All four tables in your SQL already exist in the database, with row-level security enabled and the policies you listed already in place:

- `operator_follows` (2 policies)
- `quest_packs` (1 policy)
- `operator_quest_packs` (1 policy)
- `reported_content` (3 policies)

So re-running that SQL would be a no-op — every statement is `IF NOT EXISTS` or a re-create of an identical policy.

However, a check of the actual table privileges shows **none of these four tables have any grants** to `anon`, `authenticated`, or `service_role`. Security rules alone are not enough: without grants the app gets a permission error on every read and write to these tables. This is almost certainly why follows, quest packs, and reporting don't work in the app.

## The fix

One migration that adds the missing privileges, matched to each table's existing access rules:

- `operator_follows` — signed-in users can read and manage their own follows; backend services full access.
- `quest_packs` — read-only for everyone, including signed-out visitors (the catalog is public); backend services full access.
- `operator_quest_packs` — signed-in users read/write their own purchases; backend services full access.
- `reported_content` — signed-in users can file and read reports; backend services full access.

No schema, column, or policy changes — the structure you pasted stays exactly as it is.

## Technical detail

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_follows TO authenticated;
GRANT ALL ON public.operator_follows TO service_role;

GRANT SELECT ON public.quest_packs TO anon, authenticated;
GRANT ALL ON public.quest_packs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_quest_packs TO authenticated;
GRANT ALL ON public.operator_quest_packs TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.reported_content TO authenticated;
GRANT ALL ON public.reported_content TO service_role;
```

After the migration I'll re-run the privilege check to confirm each table is reachable, and run the database linter.

## Optional follow-up (not included unless you want it)

`operator_follows.follows_read` and the `reported_content` read/update rules are currently open to everyone / every signed-in user. Reports in particular are visible and editable by any signed-in user, which normally should be admin-only via the existing `is_admin()` function. Say the word and I'll tighten those in the same migration.
