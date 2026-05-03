CREATE OR REPLACE FUNCTION public.consume_message_credit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Reset counter if it's a new day
  UPDATE public.profiles
    SET daily_message_count = 0,
        message_count_reset_date = CURRENT_DATE
    WHERE id = auth.uid()
      AND message_count_reset_date < CURRENT_DATE;

  -- Increment and return new value
  UPDATE public.profiles
    SET daily_message_count = COALESCE(daily_message_count, 0) + 1
    WHERE id = auth.uid()
    RETURNING daily_message_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;