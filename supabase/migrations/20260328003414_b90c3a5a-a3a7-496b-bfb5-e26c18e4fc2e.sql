-- Attach the existing profile protection trigger so critical stats cannot be directly changed from the client
DROP TRIGGER IF EXISTS protect_profile_stats ON public.profiles;
CREATE TRIGGER protect_profile_stats
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_update_allowed();

-- Tighten audit integrity for achievements and activity logs
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users manage own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can update own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can delete own activity" ON public.activity_log;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'Users can view own achievements'
  ) THEN
    CREATE POLICY "Users can view own achievements"
    ON public.achievements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_log' AND policyname = 'Users can read own activity'
  ) THEN
    CREATE POLICY "Users can read own activity"
    ON public.activity_log
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_log' AND policyname = 'Users can insert own activity'
  ) THEN
    CREATE POLICY "Users can insert own activity"
    ON public.activity_log
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;