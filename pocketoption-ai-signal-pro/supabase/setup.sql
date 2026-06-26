-- =============================================================
-- PocketOption AI Signal Pro - COMBINED SETUP
-- Run this entire file once in the Supabase SQL Editor.
-- It applies schema -> functions/triggers -> RLS -> seed in order.
-- Idempotent: safe to re-run.
-- =============================================================

-- >>> 0001_init.sql >>>
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

-- >>> 0002_functions_triggers.sql >>>
-- =====================================================================
-- Functions & triggers
-- =====================================================================

-- Generic updated_at maintainer.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_licenses_updated on public.licenses;
create trigger trg_licenses_updated before update on public.licenses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_assets_updated on public.assets;
create trigger trg_assets_updated before update on public.assets
  for each row execute function public.set_updated_at();

-- Create a profile row automatically when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user an admin or super admin?
create or replace function public.is_admin()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Helper: does the current user hold a currently-valid active license?
create or replace function public.has_active_license()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.licenses
    where assigned_user_id = auth.uid()
      and status = 'active'
      and (is_lifetime or expires_at is null or expires_at > now())
  );
$$;

-- Atomic license activation. Binds a license to the calling user + device.
-- Returns the activated license row as jsonb (or raises an exception).
create or replace function public.activate_license(
  p_license_key text,
  p_device_fingerprint text,
  p_device_name text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_license public.licenses%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_license from public.licenses
  where license_key = p_license_key
  for update;

  if not found then
    raise exception 'LICENSE_NOT_FOUND';
  end if;

  if v_license.status in ('suspended', 'revoked') then
    raise exception 'LICENSE_BLOCKED';
  end if;

  if not v_license.is_lifetime
     and v_license.expires_at is not null
     and v_license.expires_at <= now() then
    update public.licenses set status = 'expired' where id = v_license.id;
    raise exception 'LICENSE_EXPIRED';
  end if;

  -- Already bound to a different user?
  if v_license.assigned_user_id is not null
     and v_license.assigned_user_id <> v_uid then
    raise exception 'LICENSE_IN_USE';
  end if;

  -- Bound to a different device (single device limit)?
  if v_license.device_fingerprint is not null
     and v_license.device_fingerprint <> p_device_fingerprint then
    raise exception 'DEVICE_LIMIT_REACHED';
  end if;

  update public.licenses
  set assigned_user_id   = v_uid,
      device_fingerprint = p_device_fingerprint,
      device_name        = p_device_name,
      status             = 'active',
      activated_at       = coalesce(activated_at, now()),
      last_login_at      = now()
  where id = v_license.id
  returning * into v_license;

  insert into public.license_logs (license_id, user_id, action, detail)
  values (v_license.id, v_uid, 'activated',
          jsonb_build_object('device_name', p_device_name));

  return to_jsonb(v_license);
end;
$$;

-- Push a generated signal into immutable history (called by signal writer).
create or replace function public.archive_signal()
returns trigger
language plpgsql
as $$
begin
  insert into public.signal_history
    (asset_id, asset_symbol, timeframe, direction, confidence, price, trend, risk_level, reasons)
  select new.asset_id, a.symbol, new.timeframe, new.direction, new.confidence,
         new.price, new.trend, new.risk_level, new.reasons
  from public.assets a where a.id = new.asset_id;
  return new;
end;
$$;

drop trigger if exists trg_signals_archive on public.signals;
create trigger trg_signals_archive after insert or update on public.signals
  for each row execute function public.archive_signal();

-- >>> 0003_rls_policies.sql >>>
-- =====================================================================
-- Row Level Security policies
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.licenses       enable row level security;
alter table public.license_logs   enable row level security;
alter table public.assets         enable row level security;
alter table public.signals        enable row level security;
alter table public.signal_history enable row level security;
alter table public.favorites      enable row level security;
alter table public.notifications  enable row level security;
alter table public.announcements  enable row level security;
alter table public.settings       enable row level security;
alter table public.activity_logs  enable row level security;

-- ---------------- profiles ----------------
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles admin read"  on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin all"   on public.profiles;

create policy "profiles self read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles admin read" on public.profiles
  for select using (public.is_admin());
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles admin all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- licenses ----------------
drop policy if exists "licenses owner read" on public.licenses;
drop policy if exists "licenses admin all"  on public.licenses;

create policy "licenses owner read" on public.licenses
  for select using (assigned_user_id = auth.uid());
create policy "licenses admin all" on public.licenses
  for all using (public.is_admin()) with check (public.is_admin());
-- Activation happens through the SECURITY DEFINER function activate_license().

-- ---------------- license_logs ----------------
drop policy if exists "license_logs owner read" on public.license_logs;
drop policy if exists "license_logs admin all"  on public.license_logs;

create policy "license_logs owner read" on public.license_logs
  for select using (user_id = auth.uid());
create policy "license_logs admin all" on public.license_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- assets (readable by any authenticated user) ----------------
drop policy if exists "assets read"      on public.assets;
drop policy if exists "assets admin all" on public.assets;

create policy "assets read" on public.assets
  for select using (auth.role() = 'authenticated');
create policy "assets admin all" on public.assets
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- signals / signal_history (read for licensed users) ----------------
drop policy if exists "signals read"      on public.signals;
drop policy if exists "signals admin all" on public.signals;
create policy "signals read" on public.signals
  for select using (public.has_active_license() or public.is_admin());
create policy "signals admin all" on public.signals
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "signal_history read"      on public.signal_history;
drop policy if exists "signal_history admin all" on public.signal_history;
create policy "signal_history read" on public.signal_history
  for select using (public.has_active_license() or public.is_admin());
create policy "signal_history admin all" on public.signal_history
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- favorites (owner only) ----------------
drop policy if exists "favorites owner all" on public.favorites;
create policy "favorites owner all" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------- notifications (owner read/update, admin all) ----------------
drop policy if exists "notifications owner read"   on public.notifications;
drop policy if exists "notifications owner update" on public.notifications;
drop policy if exists "notifications admin all"    on public.notifications;
create policy "notifications owner read" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications owner update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications admin all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- announcements (read all authenticated, admin write) ----------------
drop policy if exists "announcements read"      on public.announcements;
drop policy if exists "announcements admin all" on public.announcements;
create policy "announcements read" on public.announcements
  for select using (auth.role() = 'authenticated');
create policy "announcements admin all" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- settings (read all authenticated, admin write) ----------------
drop policy if exists "settings read"      on public.settings;
drop policy if exists "settings admin all" on public.settings;
create policy "settings read" on public.settings
  for select using (auth.role() = 'authenticated');
create policy "settings admin all" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- activity_logs (admin only) ----------------
drop policy if exists "activity_logs admin all" on public.activity_logs;
create policy "activity_logs admin all" on public.activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- >>> seed.sql >>>
-- =====================================================================
-- Seed data: core assets + default settings.
-- Safe to run multiple times (idempotent upserts on unique symbol/key).
-- =====================================================================

insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  -- Major forex
  ('EURUSD', 'EURUSD=X', 'Euro / US Dollar',        'major_forex', 'yahoo', 5, 1),
  ('GBPUSD', 'GBPUSD=X', 'British Pound / US Dollar','major_forex', 'yahoo', 5, 2),
  ('USDJPY', 'USDJPY=X', 'US Dollar / Yen',          'major_forex', 'yahoo', 3, 3),
  ('USDCHF', 'USDCHF=X', 'US Dollar / Swiss Franc',  'major_forex', 'yahoo', 5, 4),
  ('AUDUSD', 'AUDUSD=X', 'Australian / US Dollar',   'major_forex', 'yahoo', 5, 5),
  ('USDCAD', 'USDCAD=X', 'US Dollar / Canadian',     'major_forex', 'yahoo', 5, 6),
  -- Minor forex
  ('EURGBP', 'EURGBP=X', 'Euro / British Pound',     'minor_forex', 'yahoo', 5, 10),
  ('EURJPY', 'EURJPY=X', 'Euro / Yen',               'minor_forex', 'yahoo', 3, 11),
  ('GBPJPY', 'GBPJPY=X', 'Pound / Yen',              'minor_forex', 'yahoo', 3, 12),
  -- Exotic forex
  ('USDTRY', 'USDTRY=X', 'US Dollar / Turkish Lira', 'exotic_forex','yahoo', 4, 20),
  ('USDZAR', 'USDZAR=X', 'US Dollar / Rand',         'exotic_forex','yahoo', 4, 21),
  -- Crypto
  ('BTCUSD', 'BTC-USD',  'Bitcoin / US Dollar',      'crypto',      'yahoo', 2, 30),
  ('ETHUSD', 'ETH-USD',  'Ethereum / US Dollar',     'crypto',      'yahoo', 2, 31),
  ('SOLUSD', 'SOL-USD',  'Solana / US Dollar',       'crypto',      'yahoo', 3, 32),
  -- Indices
  ('SPX',    '^GSPC',    'S&P 500',                  'indices',     'yahoo', 2, 40),
  ('NDX',    '^NDX',     'Nasdaq 100',               'indices',     'yahoo', 2, 41),
  ('DJI',    '^DJI',     'Dow Jones 30',             'indices',     'yahoo', 2, 42),
  -- Commodities
  ('XAUUSD', 'GC=F',     'Gold',                     'commodities', 'yahoo', 2, 50),
  ('XAGUSD', 'SI=F',     'Silver',                   'commodities', 'yahoo', 3, 51),
  ('WTI',    'CL=F',     'Crude Oil WTI',            'commodities', 'yahoo', 2, 52)
on conflict (symbol) do update
  set name = excluded.name,
      provider_symbol = excluded.provider_symbol,
      category = excluded.category;

-- Example OTC pair (disabled until an admin assigns a data provider).
insert into public.assets
  (symbol, name, category, is_otc, is_enabled, data_provider, price_precision, sort_order, otc_refresh_ms, otc_sessions)
values
  ('EURUSD-OTC', 'EUR/USD OTC', 'otc', true, false, 'otc_custom', 5, 60,
   5000, '[{"day":"sat","open":"00:00","close":"23:59"},{"day":"sun","open":"00:00","close":"23:59"}]'::jsonb)
on conflict (symbol) do nothing;

insert into public.settings (key, value) values
  ('signal_engine', '{"min_confidence":55,"max_signals_per_minute":12}'::jsonb),
  ('market_data',   '{"refresh_seconds":5,"provider":"yahoo"}'::jsonb),
  ('branding',      '{"support_telegram":"@devtech77"}'::jsonb)
on conflict (key) do nothing;
