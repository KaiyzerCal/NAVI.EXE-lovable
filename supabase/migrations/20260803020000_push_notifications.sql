-- ============================================================
-- PUSH NOTIFICATIONS — infrastructure
-- ============================================================
-- 1. push_subscriptions table (schema already existed in
--    20260424000020_phase1_monetization.sql but was never applied
--    live — send-push-notification has been querying a table that
--    doesn't exist since that function was written).
-- 2. pg_cron schedule for daily-reminders, which is fully coded
--    (5 reminder types) but has never actually run — its own
--    comment says "Runs every hour via Supabase cron" yet no cron
--    job for it exists anywhere in this project's history.
--
-- SETUP REQUIRED AFTER THIS MIGRATION APPLIES (one-time, via the
-- Supabase SQL editor, since Vault secrets can't be set from a
-- migration file):
--   select vault.create_secret('https://fjkkcrmhptrzobajjsqg.supabase.co', 'supabase_url');
--   select vault.create_secret('<service-role-key-from-project-settings>', 'service_role_key');
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_self" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_self" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('navi-daily-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'navi-daily-reminders'
);

-- Hourly, on the hour — daily-reminders itself filters by each user's
-- local hour, so it needs to run once per UTC hour to catch everyone.
SELECT cron.schedule(
  'navi-daily-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/daily-reminders',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- Verify with: select jobid, schedule, command, jobname from cron.job;
