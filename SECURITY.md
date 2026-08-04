# Security model

## Identity

Every edge function that acts on user data derives the user id from the verified
Supabase JWT (`_shared/auth.ts → getAuthedUser`). Request bodies are never
trusted for identity. Notably, `navi-chat` previously read `context.user_id`
from the body; it now authenticates the caller and ignores that field.

## Authorization

- **Row-Level Security** is enabled on user tables; per-user policies scope rows
  to `auth.uid()`.
- **Game economy** (XP, coins, levels, bond stats) is protected by the
  `check_profile_update_allowed` trigger so clients cannot tamper with their own
  currency even though they can update their profile row.
- **Admin** is an `owner` role in `public.user_roles`, checked server-side via
  `has_role()` / `requireOwner()`. The old client-side `VITE_ADMIN_USER_IDS`
  gate is gone. All admin reads/writes go through the owner-gated `admin` edge
  function using the service role; moderation tables (`reported_content`,
  `beta_feedback`) are readable only by owners.

## Payments

- `create-checkout` requires an authenticated caller and derives the Stripe
  metadata `userId`/`customer_email` from the token, not the body.
- Webhooks (`payments-webhook`, `stripe-webhook`) are authenticated by Stripe
  signatures (HMAC over the raw body with a 5-minute timestamp window), which is
  why they run with `verify_jwt = false`.
- `set-product-tax-codes` is a bootstrap endpoint restricted to `owner` callers.

## CORS

`_shared/cors.ts` echoes only origins on the `ALLOWED_ORIGINS` allowlist. If the
allowlist is unset it falls back to `*` for local dev — always set it in
production.

## Secrets

`.env` is untracked and holds only publishable values. Service-role, Stripe
secret, and AI keys live exclusively in Supabase function secrets.

### If the previously-committed `.env` contained anything sensitive

The anon key and Stripe **test** publishable key are safe by design. If any
service-role key, Stripe **live**/secret key, or webhook secret was ever
committed, rotate it and purge it from git history:

```bash
git rm --cached .env .env.development
git commit -m "Remove env files from tracking"
# then rewrite history, e.g. with git filter-repo:
git filter-repo --path .env --path .env.development --invert-paths
```
