# Deploying to Vercel (auto-deploy)

This app lives in the **`pocketoption-ai-signal-pro/` subfolder** of the
`Neel-codex/clickads` repo. The single most important setting is the Vercel
**Root Directory** — point it at this subfolder or the build will fail.

No local setup is required. Once the repo is connected, Vercel auto-deploys on
every push (merges to `main` -> Production, branches/PRs -> Preview).

---

## 1. Set up Supabase (required — the app needs a database)

In the **Supabase SQL Editor**, run these files in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_functions_triggers.sql`
3. `supabase/migrations/0003_rls_policies.sql`
4. `supabase/seed.sql` _(optional — seeds core assets + settings)_

Then copy these from **Supabase → Project Settings → API**:
- Project URL
- `anon` public key
- `service_role` secret key

---

## 2. Import the repo into Vercel

1. [vercel.com/new](https://vercel.com/new) → import **`Neel-codex/clickads`**.
2. **Root Directory:** `pocketoption-ai-signal-pro`  ← required
3. Framework auto-detects as **Next.js**. Leave build/install commands default.

After import, Vercel deploys automatically on every git push.

---

## 3. Environment variables (Vercel dashboard)

**Settings → Environment Variables.** Add each, applied to Production + Preview:

| Name | Value | Browser-exposed |
|------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` key | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key | **no (server only)** |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` | yes |
| `LICENSE_SIGNING_SECRET` | long random string (`openssl rand -hex 32`) | no |
| `NEXT_PUBLIC_SUPPORT_TELEGRAM` | `@devtech77` | yes |
| `NEXT_PUBLIC_MARKET_REFRESH_SECONDS` | `5` _(optional)_ | yes |
| `MARKET_DATA_BASE_URL` | `https://query1.finance.yahoo.com` _(optional)_ | no |

After adding variables, **redeploy** (Deployments → ⋯ → Redeploy) so they apply.

---

## 4. Wire up auth redirects

In **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://<your-project>.vercel.app`
- **Redirect URLs:** add `https://<your-project>.vercel.app/**`

Also set `NEXT_PUBLIC_APP_URL` to the same live URL (used in confirmation emails).

---

## 5. Create your first admin + a license

The app is locked behind a license. After signing up through the deployed site
(which creates a `profiles` row), run in the **Supabase SQL Editor**:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';

insert into public.licenses (license_key, type, is_lifetime, device_limit, status)
values ('PO-TEST-0001-DEMO', 'lifetime', true, 1, 'unused');
```

Then activate `PO-TEST-0001-DEMO` on the `/activate` screen of the live site.

---

## Troubleshooting

- **Build fails / "No Next.js detected":** Root Directory is not set to
  `pocketoption-ai-signal-pro`.
- **Auth/email links point to localhost:** `NEXT_PUBLIC_APP_URL` and the Supabase
  Site URL still use localhost; set them to the Vercel URL and redeploy.
- **"Live data unavailable" on OTC pairs:** expected — OTC pairs need an admin to
  assign a working data provider; Yahoo does not provide OTC prices.
