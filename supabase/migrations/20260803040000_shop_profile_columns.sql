-- ============================================================
-- profiles.custom_title / has_premium_frame — referenced by
-- ShopPage.tsx's Title and Premium Frame purchases, but neither
-- column exists live (confirmed via direct query). Without these,
-- both purchases would deduct currency then silently 400 on the
-- follow-up update — the same class of bug as the missing
-- username column.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_premium_frame boolean NOT NULL DEFAULT false;
