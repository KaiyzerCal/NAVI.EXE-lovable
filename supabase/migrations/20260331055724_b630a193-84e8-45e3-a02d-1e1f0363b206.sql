DROP TRIGGER IF EXISTS protect_profile_stats ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_update_allowed();