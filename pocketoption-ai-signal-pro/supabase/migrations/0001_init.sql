-- =====================================================================
-- PocketOption AI Signal Pro — Initial schema
-- PostgreSQL (Supabase). Run in Supabase SQL editor or via `supabase db push`.
-- =====================================================================

create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "citext";          -- case-insensitive text

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type license_status as enum ('unused', 'active', 'suspended', 'expired', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type license_type as enum ('7d', '30d', '90d', 'lifetime');
exception when duplicate_object then null; end $$;

do $$ begin
  create type asset_category as enum
    ('major_forex','minor_forex','exotic_forex','crypto','indices','commodities','otc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signal_direction as enum ('buy', 'sell', 'neutral');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null,
  full_name     text,
  avatar_url    text,
  role          user_role not null default 'user',
  theme         text not null default 'dark',
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);

-- ---------------------------------------------------------------------
-- licenses
-- ---------------------------------------------------------------------
create table if not exists public.licenses (
  id                 uuid primary key default gen_random_uuid(),
  license_key        text unique not null,
  type               license_type not null,
  status             license_status not null default 'unused',
  is_lifetime        boolean not null default false,
  device_limit       int not null default 1 check (device_limit >= 1),
  expires_at         timestamptz,                       -- null when lifetime
  assigned_user_id   uuid references public.profiles(id) on delete set null,
  device_fingerprint text,
  device_name        text,
  activated_at       timestamptz,
  last_login_at      timestamptz,
  notes              text,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_licenses_status on public.licenses(status);
create index if not exists idx_licenses_user on public.licenses(assigned_user_id);
create index if not exists idx_licenses_expires on public.licenses(expires_at);

-- ---------------------------------------------------------------------
-- license_logs  (audit trail for license actions)
-- ---------------------------------------------------------------------
create table if not exists public.license_logs (
  id          uuid primary key default gen_random_uuid(),
  license_id  uuid references public.licenses(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,            -- generated | activated | suspended | renewed | reset_device | revoked | login
  detail      jsonb not null default '{}'::jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index if not exists idx_license_logs_license on public.license_logs(license_id);
create index if not exists idx_license_logs_created on public.license_logs(created_at desc);

-- ---------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------
create table if not exists public.assets (
  id             uuid primary key default gen_random_uuid(),
  symbol         text not null,             -- internal symbol e.g. EURUSD, BTC-USD
  provider_symbol text,                     -- e.g. Yahoo "EURUSD=X", "BTC-USD"
  name           text not null,
  category       asset_category not null,
  is_otc         boolean not null default false,
  is_enabled     boolean not null default true,
  data_provider  text not null default 'yahoo',  -- yahoo | otc_custom | manual
  price_precision int not null default 5,
  sort_order     int not null default 0,
  -- OTC config (null for non-OTC)
  otc_sessions   jsonb,                     -- [{day, open, close}] in UTC
  otc_refresh_ms int,
  symbol_mapping jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (symbol)
);
create index if not exists idx_assets_category on public.assets(category);
create index if not exists idx_assets_enabled on public.assets(is_enabled);

-- ---------------------------------------------------------------------
-- signals  (latest computed signal per asset/timeframe; upserted)
-- ---------------------------------------------------------------------
create table if not exists public.signals (
  id           uuid primary key default gen_random_uuid(),
  asset_id     uuid not null references public.assets(id) on delete cascade,
  timeframe    text not null,
  direction    signal_direction not null,
  confidence   numeric(5,2) not null check (confidence >= 0 and confidence <= 100),
  price        numeric,
  trend        text,
  risk_level   text,
  support      numeric,
  resistance   numeric,
  reasons      jsonb not null default '[]'::jsonb,
  indicators   jsonb not null default '{}'::jsonb,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (asset_id, timeframe)
);
create index if not exists idx_signals_asset on public.signals(asset_id);

-- ---------------------------------------------------------------------
-- signal_history  (immutable record of generated signals)
-- ---------------------------------------------------------------------
create table if not exists public.signal_history (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid references public.assets(id) on delete set null,
  asset_symbol text not null,
  timeframe   text not null,
  direction   signal_direction not null,
  confidence  numeric(5,2) not null,
  price       numeric,
  trend       text,
  risk_level  text,
  reasons     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_signal_history_created on public.signal_history(created_at desc);
create index if not exists idx_signal_history_asset on public.signal_history(asset_id);

-- ---------------------------------------------------------------------
-- favorites  (user pinned/favorited assets)
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  asset_id   uuid not null references public.assets(id) on delete cascade,
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, asset_id)
);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  kind       text not null default 'info',  -- info | signal | license | system
  is_read    boolean not null default false,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- announcements  (broadcast by admins)
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  is_active  boolean not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- settings  (global key/value config)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- activity_logs  (general audit)
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  text,
  detail     jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);
