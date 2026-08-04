
-- Create is_admin RPC used by useOwner hook
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','owner')
  );
$$;

-- Grant owner role to user account
INSERT INTO public.user_roles (user_id, role)
VALUES ('3dc4735b-b938-4b3a-9d14-268ce2315790', 'owner')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('3dc4735b-b938-4b3a-9d14-268ce2315790', 'admin')
ON CONFLICT DO NOTHING;

-- Set elite tier for both accounts
UPDATE public.profiles
SET subscription_tier = 'elite', updated_at = now()
WHERE id IN (
  '3dc4735b-b938-4b3a-9d14-268ce2315790',
  'cc43fd73-6cfd-4812-b3bd-e0071de46bf0'
);
