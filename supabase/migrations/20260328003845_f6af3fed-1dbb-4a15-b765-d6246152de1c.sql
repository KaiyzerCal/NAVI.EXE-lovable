-- Make write restrictions explicit so scanners and RLS both reflect intended access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'No direct achievement inserts'
  ) THEN
    CREATE POLICY "No direct achievement inserts"
    ON public.achievements
    FOR INSERT
    TO authenticated
    WITH CHECK (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'No direct achievement updates'
  ) THEN
    CREATE POLICY "No direct achievement updates"
    ON public.achievements
    FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'No direct achievement deletes'
  ) THEN
    CREATE POLICY "No direct achievement deletes"
    ON public.achievements
    FOR DELETE
    TO authenticated
    USING (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_log' AND policyname = 'No activity log updates'
  ) THEN
    CREATE POLICY "No activity log updates"
    ON public.activity_log
    FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_log' AND policyname = 'No activity log deletes'
  ) THEN
    CREATE POLICY "No activity log deletes"
    ON public.activity_log
    FOR DELETE
    TO authenticated
    USING (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_unlocked_skins' AND policyname = 'Users can update own unlocked skins'
  ) THEN
    CREATE POLICY "Users can update own unlocked skins"
    ON public.user_unlocked_skins
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_unlocked_skins' AND policyname = 'Users can delete own unlocked skins'
  ) THEN
    CREATE POLICY "Users can delete own unlocked skins"
    ON public.user_unlocked_skins
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;