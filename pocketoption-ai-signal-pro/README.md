# PocketOption AI Signal Pro

A mobile-first **Progressive Web App** for **market analysis and educational trading signals**, built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase**, deployable on **Vercel**.

> **Compliance:** This application is a market analysis and educational signal platform. It does **not** execute trades, connect to Pocket Option accounts, guarantee profits, promise accuracy, or provide financial advice.
>
> _Signals are analytical estimates based on public market data and technical analysis. They should not be interpreted as financial advice or guarantees of future market performance._

---

## What's in this repository

This is a **working foundation** — it installs, type-checks, builds, and runs. It contains the architecture and the highest-value, fully-implemented pieces. See the [Roadmap](#roadmap) for what is intentionally left as a next phase.

### Implemented and verified

| Area | Status | Where |
|------|--------|-------|
| Project scaffold (Next 15 App Router, TS strict, Tailwind, PWA) | ✅ | root, `src/app` |
| Dark glassmorphism theme + UI primitives | ✅ | `src/app/globals.css`, `src/components/ui` |
| **Analysis engine** (12 indicators, candlestick patterns, Smart Money Concepts, weighted signal engine) | ✅ tested | `src/lib/analysis` |
| **Supabase schema** (13 tables, RLS, functions, triggers, seed) | ✅ | `supabase/migrations`, `supabase/seed.sql` |
| Auth (register, login, logout, forgot/reset password, verify email) | ✅ | `src/app/(auth pages)`, `src/app/actions/auth.ts` |
| Route protection + role/license gating | ✅ | `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/app/app/layout.tsx` |
| **License activation** (device fingerprint, atomic RPC binding) | ✅ | `src/app/activate`, `src/app/actions/license.ts`, DB `activate_license()` |
| Live signal API + dashboard (asset/timeframe pickers, polling, confidence ring, reasons) | ✅ | `src/app/api/signal`, `src/components/dashboard` |
| Yahoo Finance market data service | ✅ | `src/services/market-data.ts` |
| Configurable OTC provider architecture (honest "unavailable" fallback) | ✅ | `src/services/otc-provider.ts` |
| App pages: dashboard, markets, history, favorites, profile | ✅ | `src/app/app/*` |
| PWA (manifest, service worker, offline page, icons) | ✅ | `public/`, `scripts/generate_icons.py` |
| Unit tests for the engine | ✅ 7/7 | `src/lib/analysis/__tests__` |

---

## Tech stack

- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **React 19**, **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS** + class-variance-authority (shadcn/ui conventions)
- **Supabase** — Postgres, Auth, RLS, Realtime (clients wired)
- **TanStack Query**, **Zustand**, **React Hook Form**, **Zod**
- **Framer Motion**, **Lucide**, **lightweight-charts**, **Recharts**
- **Vitest** for unit tests

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase project values (Dashboard → Project Settings → API). Only `NEXT_PUBLIC_*` variables are exposed to the browser; the service role key and license secret stay server-side.

### 3. Set up the database

In the Supabase SQL editor (or via the Supabase CLI), run, in order:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_functions_triggers.sql
supabase/migrations/0003_rls_policies.sql
supabase/seed.sql        # optional: seeds core assets + settings
```

Or with the CLI:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 4. Create your first admin + a license

After signing up through the app (which creates a `profiles` row via trigger), promote yourself and mint a license in the SQL editor:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';

insert into public.licenses (license_key, type, is_lifetime, device_limit, status)
values ('PO-TEST-0001-DEMO', 'lifetime', true, 1, 'unused');
```

### 5. Run

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run test       # vitest
```

---

## How the signal engine works

`generateSignal(candles)` (in `src/lib/analysis/signal-engine.ts`) gathers evidence from three groups and combines them with weights:

1. **Indicators** — EMA, RSI, MACD, ATR, ADX/DI, Bollinger, CCI, Stochastic RSI, SuperTrend, Ichimoku, VWAP, volume.
2. **Candlestick patterns** — doji, hammer, shooting star, marubozu, engulfing, harami, morning/evening star, three soldiers/crows, inside/outside bar.
3. **Smart Money Concepts** — BOS, CHoCH, liquidity sweeps, FVG, order blocks, premium/discount zones, mitigation/breaker blocks.

Each piece of evidence has a direction and weight. The engine produces a `buy` / `sell` / `neutral` result with a **confidence capped at 95%** (it never implies certainty), a trend label, a risk level derived from ATR volatility, support/resistance, and a ranked list of human-readable reasons.

OTC pairs do **not** use Yahoo data — they route through the configurable OTC provider layer, which honestly reports "live OTC data unavailable" until an admin assigns a working provider.

---

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. Deploy. `vercel.json` and `next.config.mjs` set the framework, region, and security headers.

---

## Roadmap (next phases)

The following are scoped but not yet built in this foundation. They build naturally on the existing schema, middleware, and engine:

- **Admin dashboard & License Manager UI** — generate/bulk-generate/CSV import-export/suspend/renew/reset-device/search. (DB + key generator in `src/lib/license/license-key.ts` are ready.)
- **Realtime wiring** — subscribe to `signals`, `notifications`, `announcements`, `licenses` via Supabase Realtime channels.
- **TradingView Lightweight Charts** panel on the dashboard (the API already returns candles).
- **Signal history CSV export**, favorites pin/unpin actions, notifications center.
- **Admin OTC pair management UI** + a concrete OTC provider implementation.
- **Push notifications** wiring to the service worker `push` handler.
- **E2E tests** and CI.

---

## Support

Telegram: **@devtech77** — see the in-app [Support](/support) page.
