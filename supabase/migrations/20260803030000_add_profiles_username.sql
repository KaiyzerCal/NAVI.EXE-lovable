-- ============================================================
-- profiles.username — referenced live by SettingsPage.tsx (the
-- whole @handle input + debounced uniqueness check) and
-- SearchPage.tsx (search-by-username), but the column never
-- actually existed on the live database. Confirmed directly
-- against the REST API: `column profiles.username does not exist`
-- (42703) — every save-with-username and every operator search
-- has been silently 400ing since these features were built.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- SettingsPage already normalizes input to /^[a-zA-Z0-9_]{3,20}$/ and
-- lowercases it client-side before saving, so no separate CHECK/lower()
-- constraint is added here — this column just needs to exist.
