-- achievements has correct RLS (no direct client insert/update/delete — only
-- owner-scoped SELECT), but src/hooks/useAchievements.ts still tries to
-- insert the starter set and update unlocked/unlocked_at directly from the
-- client. Every one of those calls has been 403ing since that RLS landed,
-- meaning new users never get achievement rows seeded and existing ones can
-- never actually unlock — the whole feature has been silently dead. Add
-- SECURITY DEFINER RPCs, scoped to auth.uid(), so the client can keep its
-- existing seed-if-empty / check-and-unlock logic without needing direct
-- table writes.

create or replace function public.seed_my_achievements()
returns setof public.achievements
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.achievements where user_id = auth.uid()) then
    insert into public.achievements (user_id, name, description, category, threshold, icon, rarity, source, unlocked)
    values
      (auth.uid(), 'First Mission', 'Complete your first quest', 'quests', 1, '🗡️', 'COMMON', 'system', false),
      (auth.uid(), 'Quest Runner', 'Complete 10 quests', 'quests', 10, '⚔️', 'COMMON', 'system', false),
      (auth.uid(), 'Centurion', 'Complete 100 quests', 'quests', 100, '🏆', 'RARE', 'system', false),
      (auth.uid(), 'Legendary Hunter', 'Complete 500 quests', 'quests', 500, '👑', 'EPIC', 'system', false),
      (auth.uid(), 'Main Arc Complete', 'Complete a Main quest', 'quests', 1, '⭐', 'RARE', 'system', false),
      (auth.uid(), 'Side Hustler', 'Complete 5 Side quests', 'quests', 5, '🎯', 'COMMON', 'system', false),
      (auth.uid(), 'First Entry', 'Write your first journal entry', 'journal', 1, '📖', 'COMMON', 'system', false),
      (auth.uid(), 'Chronicler', 'Write 10 journal entries', 'journal', 10, '📚', 'COMMON', 'system', false),
      (auth.uid(), 'Archivist', 'Write 50 journal entries', 'journal', 50, '🗂️', 'RARE', 'system', false),
      (auth.uid(), 'Consistent', 'Maintain a 3-day streak', 'streak', 3, '🔥', 'COMMON', 'system', false),
      (auth.uid(), 'Week Warrior', 'Maintain a 7-day streak', 'streak', 7, '💥', 'RARE', 'system', false),
      (auth.uid(), 'Iron Will', 'Maintain a 30-day streak', 'streak', 30, '🌊', 'EPIC', 'system', false),
      (auth.uid(), 'Unbreakable', 'Maintain a 100-day streak', 'streak', 100, '💎', 'LEGENDARY', 'system', false),
      (auth.uid(), 'Power Up', 'Earn 1,000 total XP', 'xp', 1000, '⚡', 'COMMON', 'system', false),
      (auth.uid(), 'XP Grinder', 'Earn 10,000 total XP', 'xp', 10000, '🌟', 'RARE', 'system', false),
      (auth.uid(), 'Max Power', 'Earn 100,000 total XP', 'xp', 100000, '☀️', 'LEGENDARY', 'system', false),
      (auth.uid(), 'Calibrated', 'Complete the MBTI personality quiz', 'character', 1, '🧠', 'COMMON', 'system', false),
      (auth.uid(), 'Sub-Classed', 'Equip a sub-class', 'character', 1, '🎭', 'COMMON', 'system', false),
      (auth.uid(), 'Operator Lv10', 'Reach operator level 10', 'character', 10, '🛡️', 'RARE', 'system', false),
      (auth.uid(), 'Operator Lv50', 'Reach operator level 50', 'character', 50, '🌙', 'EPIC', 'system', false),
      (auth.uid(), 'Max Operator', 'Reach operator level 100', 'character', 100, '🌌', 'LEGENDARY', 'system', false),
      (auth.uid(), 'Jack In', 'Send your first message to NAVI', 'navi', 1, '🤖', 'COMMON', 'system', false),
      (auth.uid(), 'Deep Link', 'Send 100 messages to NAVI', 'navi', 100, '💬', 'RARE', 'system', false),
      (auth.uid(), 'Full Sync', 'Reach NAVI bond level 10', 'navi', 10, '🔗', 'EPIC', 'system', false),
      (auth.uid(), 'Navi Lv10', 'Reach NAVI level 10', 'navi', 10, '✨', 'RARE', 'system', false),
      (auth.uid(), 'Navi Lv50', 'Reach NAVI level 50', 'navi', 50, '🚀', 'EPIC', 'system', false),
      (auth.uid(), 'Max Navi', 'Reach NAVI level 100', 'navi', 100, '🌠', 'LEGENDARY', 'system', false);
  end if;

  return query select * from public.achievements where user_id = auth.uid() order by created_at asc;
end;
$$;

revoke execute on function public.seed_my_achievements() from anon;
grant execute on function public.seed_my_achievements() to authenticated;

create or replace function public.unlock_my_achievements(p_ids uuid[])
returns setof public.achievements
language sql
security definer
set search_path = public
as $$
  update public.achievements
  set unlocked = true, unlocked_at = now()
  where id = any(p_ids) and user_id = auth.uid() and unlocked = false
  returning *;
$$;

revoke execute on function public.unlock_my_achievements(uuid[]) from anon;
grant execute on function public.unlock_my_achievements(uuid[]) to authenticated;
