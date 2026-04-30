-- ============================================================
-- RATE LIMITS TABLE + RPC
-- Used by navi-chat edge function for per-user per-minute throttling
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  request_count integer    NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only — edge functions use service role key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'rate_limits_service_only' AND tablename = 'rate_limits'
  ) THEN
    CREATE POLICY rate_limits_service_only ON rate_limits USING (false);
  END IF;
END $$;

-- Clean up old windows automatically (keep last 2 hours per user)
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);

-- RPC: atomically increment and return whether request is allowed
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id       uuid,
  p_window_minutes int DEFAULT 1,
  p_max_requests  int DEFAULT 20
)
RETURNS TABLE (allowed boolean, current_count int)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_window timestamptz;
  v_count  int;
BEGIN
  -- Round down to the window start
  v_window := date_trunc('minute', now());

  INSERT INTO rate_limits (user_id, window_start, request_count)
  VALUES (p_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  -- Clean up windows older than 2 hours for this user (maintenance)
  DELETE FROM rate_limits
  WHERE user_id = p_user_id
    AND window_start < now() - interval '2 hours';

  RETURN QUERY SELECT (v_count <= p_max_requests), v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
