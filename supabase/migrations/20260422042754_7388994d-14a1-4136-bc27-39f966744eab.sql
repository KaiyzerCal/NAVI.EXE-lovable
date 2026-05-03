-- Add updated_at column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Trigger to auto-update updated_at on row changes
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Atomic XP award function — eliminates race conditions
CREATE OR REPLACE FUNCTION public.award_xp(_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount = 0 THEN
    SELECT xp_total INTO new_total FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(new_total, 0);
  END IF;

  UPDATE public.profiles
    SET xp_total = COALESCE(xp_total, 0) + _amount
    WHERE id = auth.uid()
    RETURNING xp_total INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(INTEGER) TO authenticated;