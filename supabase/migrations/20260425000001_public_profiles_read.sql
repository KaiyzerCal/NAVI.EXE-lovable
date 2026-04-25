-- Allow authenticated users to read all profiles (required for social features:
-- party member display, operator search in inbox, guild rosters, leaderboards)
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
