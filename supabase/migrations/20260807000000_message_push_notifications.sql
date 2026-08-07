-- ============================================================
-- MESSAGE PUSH NOTIFICATIONS — event-driven, mirrors the
-- cron-based net.http_post + Vault pattern already proven by
-- navi-daily-reminders (20260803020000_push_notifications.sql),
-- but fires on AFTER INSERT instead of on a schedule.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_new_navi_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id uuid;
  v_supabase_url text;
  v_service_role_key text;
  v_sender_name text;
  v_preview text;
BEGIN
  SELECT CASE WHEN t.sender_user_id = NEW.sender_user_id THEN t.receiver_user_id ELSE t.sender_user_id END
    INTO v_recipient_id
  FROM public.navi_message_threads t
  WHERE t.id = NEW.thread_id;

  IF v_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url';
  SELECT decrypted_secret INTO v_service_role_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  -- Vault secrets are set up manually outside migrations (see
  -- 20260803020000_push_notifications.sql) — if they're ever missing,
  -- skip the push rather than fail the message insert.
  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  v_sender_name := COALESCE(NEW.sender_navi_name, 'A fellow operator');
  v_preview := left(COALESCE(NEW.content, 'sent you a message'), 120);

  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_service_role_key
               ),
    body    := jsonb_build_object(
                 'user_id', v_recipient_id,
                 'title', v_sender_name,
                 'body', v_preview,
                 'url', '/messages'
               ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_navi_message ON public.navi_messages;
CREATE TRIGGER trg_notify_new_navi_message
AFTER INSERT ON public.navi_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_navi_message();
