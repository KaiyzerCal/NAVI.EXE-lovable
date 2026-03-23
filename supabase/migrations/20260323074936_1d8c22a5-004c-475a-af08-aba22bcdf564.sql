
-- Add character/personality columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS character_class text,
  ADD COLUMN IF NOT EXISTS mbti_type text,
  ADD COLUMN IF NOT EXISTS navi_personality text NOT NULL DEFAULT 'ANALYTICAL',
  ADD COLUMN IF NOT EXISTS bond_affection integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS bond_trust integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS bond_loyalty integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS navi_level integer NOT NULL DEFAULT 1;

-- Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('owner', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can read own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Set owner role for the MAVIS owner
INSERT INTO public.user_roles (user_id, role) VALUES ('3dc4735b-b938-4b3a-9d14-268ce2315790', 'owner');
