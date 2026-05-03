# NAVI Core Loop — Manual Verification Checklist

## Part 1: 20-Tier Class System

Run these checks in the browser console after importing `tierFromLevel` from `@/lib/classEvolution`:

| Input | Expected |
|-------|----------|
| `tierFromLevel(0)` | `1` (clamped) |
| `tierFromLevel(1)` | `1` |
| `tierFromLevel(5)` | `1` |
| `tierFromLevel(6)` | `2` |
| `tierFromLevel(10)` | `2` |
| `tierFromLevel(11)` | `3` |
| `tierFromLevel(50)` | `10` |
| `tierFromLevel(51)` | `11` |
| `tierFromLevel(95)` | `19` |
| `tierFromLevel(96)` | `20` |
| `tierFromLevel(100)` | `20` |
| `tierFromLevel(999)` | `20` (clamped) |

### Class Tier Counts
- Open `MBTI_CLASS_MAP` in classEvolution.ts
- Confirm every one of the 16 MBTI types has exactly 20 entries in `.tiers`
- `Object.entries(MBTI_CLASS_MAP).every(([, v]) => v.tiers.length === 20)` → `true`

---

## Part 2: XP System (apply_xp action)

1. In NAVI chat, say: **"Give me 500 XP"** (or use `apply_xp` action)
2. Open Supabase → `profiles` table → find your row
3. Verify `xp_total` increased by 500
4. Verify `operator_xp` updated correctly (within-level XP)
5. Verify `operator_level` incremented if threshold was crossed
6. Check `activity_log` — a new row with `xp_gained` event should exist
7. Chat summary must say something like "Applied 500 XP" — NOT just "Done"

---

## Part 3: Skill Progression (progress_skill action)

1. In NAVI chat, say: **"Level up my [skill name] skill"**
2. Open Supabase → `skills` table → find the skill row
3. Verify `level` incremented
4. Character page → Skills tab → skill level updated without page reload
5. Chat summary must say something like "[Skill] progressed to level X"

---

## Part 4: Quest Progression and Completion

### progress_quest
1. In NAVI chat, say: **"Add progress to my [quest name] quest"**
2. Supabase → `quests` → verify `progress` column increased
3. If `progress >= total`, quest auto-completes and XP is awarded

### complete_quest_by_name
1. In NAVI chat, say: **"Complete my [quest name] quest"**
2. Supabase → `quests` → `completed: true`, `progress = total`
3. Supabase → `profiles` → `xp_total` increased by `xp_reward`
4. Quests page updates without reload

---

## Part 5: Idempotent Skill/Quest Creation

### create_or_update_skill
1. Say: "Create a skill called Fitness"
2. Check Supabase `skills` — one row with name Fitness
3. Say: "Create a skill called Fitness" again
4. Still only ONE row with name Fitness (updated, not duplicated)

### create_or_update_quest
1. Say: "Create a quest called Morning Routine"
2. Check Supabase `quests` — one row
3. Say: "Create a quest called Morning Routine" again
4. Still only ONE row (updated, not duplicated)

---

## Part 6: Navigation (set_active_tab)

1. In NAVI chat, say: **"Take me to quests"**
2. App navigates to `/quests` route
3. Check Supabase — NO mutations made (zero DB writes)
4. Chat should NOT say "Quest updated" or anything implying data was saved

---

## Part 7: Failure Visibility

1. Say something that should fail, e.g.: "Complete a quest called NONEXISTENT_QUEST_XYZ"
2. Chat response must show a failure reason, e.g.: "No active quest named 'NONEXISTENT_QUEST_XYZ' found"
3. The failure must NOT be swallowed silently
4. NAVI must NOT say "Done" or "Quest completed" if the action failed

---

## Part 8: UI Refresh Without Page Reload

1. Say: "Give me 200 XP"
2. WITHOUT refreshing the page, open the Dashboard, Stats, and Character pages
3. All pages must show the updated XP and operator level immediately
4. Quests page reflects quest changes after quest actions
5. Skills section reflects skill changes after skill actions

---

## Part 9: NAVI Never Claims Success on Failure

- Send a message that produces actions where ALL fail
- Check that NAVI's chat summary says something like "I tried, but it failed: [reason]"
- NOT "Done" or any false success message

---

## Part 10: XP Formula Consistency

Search the codebase for `xpForLevel`:
```bash
grep -r "xpForLevel" src/
```
Expected: ZERO results (the local formula was removed; all XP logic uses `xpSystem.ts`).

Search for the canonical formula:
```bash
grep -r "xpRequiredForLevel\|levelFromTotalXp\|totalXpForLevel" src/
```
Expected: references only from `xpSystem.ts` and files that import from it.

---

## Part 11: Raw Action JSON Never Visible in Chat

1. Ask NAVI to do anything that triggers actions
2. Scroll through the chat
3. You must NEVER see raw \`\`\`actions blocks or `:::ACTION{...}:::` markers in the UI
4. Only the clean message text and the execution summary should be visible
