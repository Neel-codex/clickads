-- =============================================================
-- PocketOption AI Signal Pro - COMBINED SETUP
-- Run this entire file once in the Supabase SQL Editor.
-- Applies schema -> functions/triggers -> RLS -> seed (full markets).
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

-- >>> seed.sql (full forex + Binance crypto + indices/commodities) >>>
-- =====================================================================
-- Seed data: assets (forex via Yahoo, crypto via Binance) + settings.
-- Idempotent: safe to run multiple times (upsert on unique symbol/key).
-- Crypto uses Binance public data (data-api.binance.vision); no API key.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FOREX (provider: yahoo). Yahoo symbol = <PAIR>=X.
-- ---------------------------------------------------------------------
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  -- Majors
  ('EURUSD','EURUSD=X','Euro / US Dollar','major_forex','yahoo',5,1),
  ('GBPUSD','GBPUSD=X','British Pound / US Dollar','major_forex','yahoo',5,2),
  ('USDJPY','USDJPY=X','US Dollar / Japanese Yen','major_forex','yahoo',3,3),
  ('USDCHF','USDCHF=X','US Dollar / Swiss Franc','major_forex','yahoo',5,4),
  ('AUDUSD','AUDUSD=X','Australian Dollar / US Dollar','major_forex','yahoo',5,5),
  ('USDCAD','USDCAD=X','US Dollar / Canadian Dollar','major_forex','yahoo',5,6),
  ('NZDUSD','NZDUSD=X','New Zealand Dollar / US Dollar','major_forex','yahoo',5,7),
  -- Minors / crosses
  ('EURGBP','EURGBP=X','Euro / British Pound','minor_forex','yahoo',5,10),
  ('EURJPY','EURJPY=X','Euro / Japanese Yen','minor_forex','yahoo',3,11),
  ('EURCHF','EURCHF=X','Euro / Swiss Franc','minor_forex','yahoo',5,12),
  ('EURAUD','EURAUD=X','Euro / Australian Dollar','minor_forex','yahoo',5,13),
  ('EURCAD','EURCAD=X','Euro / Canadian Dollar','minor_forex','yahoo',5,14),
  ('EURNZD','EURNZD=X','Euro / New Zealand Dollar','minor_forex','yahoo',5,15),
  ('GBPJPY','GBPJPY=X','British Pound / Japanese Yen','minor_forex','yahoo',3,16),
  ('GBPCHF','GBPCHF=X','British Pound / Swiss Franc','minor_forex','yahoo',5,17),
  ('GBPAUD','GBPAUD=X','British Pound / Australian Dollar','minor_forex','yahoo',5,18),
  ('GBPCAD','GBPCAD=X','British Pound / Canadian Dollar','minor_forex','yahoo',5,19),
  ('GBPNZD','GBPNZD=X','British Pound / New Zealand Dollar','minor_forex','yahoo',5,20),
  ('AUDJPY','AUDJPY=X','Australian Dollar / Japanese Yen','minor_forex','yahoo',3,21),
  ('AUDCHF','AUDCHF=X','Australian Dollar / Swiss Franc','minor_forex','yahoo',5,22),
  ('AUDCAD','AUDCAD=X','Australian Dollar / Canadian Dollar','minor_forex','yahoo',5,23),
  ('AUDNZD','AUDNZD=X','Australian Dollar / New Zealand Dollar','minor_forex','yahoo',5,24),
  ('NZDJPY','NZDJPY=X','New Zealand Dollar / Japanese Yen','minor_forex','yahoo',3,25),
  ('NZDCHF','NZDCHF=X','New Zealand Dollar / Swiss Franc','minor_forex','yahoo',5,26),
  ('NZDCAD','NZDCAD=X','New Zealand Dollar / Canadian Dollar','minor_forex','yahoo',5,27),
  ('CADJPY','CADJPY=X','Canadian Dollar / Japanese Yen','minor_forex','yahoo',3,28),
  ('CADCHF','CADCHF=X','Canadian Dollar / Swiss Franc','minor_forex','yahoo',5,29),
  ('CHFJPY','CHFJPY=X','Swiss Franc / Japanese Yen','minor_forex','yahoo',3,30),
  -- Exotics
  ('USDTRY','USDTRY=X','US Dollar / Turkish Lira','exotic_forex','yahoo',4,40),
  ('USDZAR','USDZAR=X','US Dollar / South African Rand','exotic_forex','yahoo',4,41),
  ('USDMXN','USDMXN=X','US Dollar / Mexican Peso','exotic_forex','yahoo',4,42),
  ('USDSGD','USDSGD=X','US Dollar / Singapore Dollar','exotic_forex','yahoo',5,43),
  ('USDHKD','USDHKD=X','US Dollar / Hong Kong Dollar','exotic_forex','yahoo',4,44),
  ('USDSEK','USDSEK=X','US Dollar / Swedish Krona','exotic_forex','yahoo',4,45),
  ('USDNOK','USDNOK=X','US Dollar / Norwegian Krone','exotic_forex','yahoo',4,46),
  ('USDDKK','USDDKK=X','US Dollar / Danish Krone','exotic_forex','yahoo',4,47),
  ('USDPLN','USDPLN=X','US Dollar / Polish Zloty','exotic_forex','yahoo',4,48),
  ('USDHUF','USDHUF=X','US Dollar / Hungarian Forint','exotic_forex','yahoo',3,49),
  ('USDCZK','USDCZK=X','US Dollar / Czech Koruna','exotic_forex','yahoo',4,50),
  ('USDINR','USDINR=X','US Dollar / Indian Rupee','exotic_forex','yahoo',3,51),
  ('USDTHB','USDTHB=X','US Dollar / Thai Baht','exotic_forex','yahoo',3,52),
  ('USDCNH','USDCNH=X','US Dollar / Chinese Yuan (offshore)','exotic_forex','yahoo',4,53),
  ('EURTRY','EURTRY=X','Euro / Turkish Lira','exotic_forex','yahoo',4,54),
  ('EURPLN','EURPLN=X','Euro / Polish Zloty','exotic_forex','yahoo',4,55),
  ('EURSEK','EURSEK=X','Euro / Swedish Krona','exotic_forex','yahoo',4,56),
  ('EURNOK','EURNOK=X','Euro / Norwegian Krone','exotic_forex','yahoo',4,57),
  ('GBPTRY','GBPTRY=X','British Pound / Turkish Lira','exotic_forex','yahoo',4,58)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol,
      name = excluded.name,
      category = excluded.category,
      data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;

-- ---------------------------------------------------------------------
-- CRYPTO (provider: binance). Internal symbol = <COIN>USD, Binance = <COIN>USDT.
-- ---------------------------------------------------------------------
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  ('BTCUSD','BTCUSDT','Bitcoin / USDT','crypto','binance',2,100),
  ('ETHUSD','ETHUSDT','Ethereum / USDT','crypto','binance',2,101),
  ('BNBUSD','BNBUSDT','BNB / USDT','crypto','binance',2,102),
  ('SOLUSD','SOLUSDT','Solana / USDT','crypto','binance',3,103),
  ('XRPUSD','XRPUSDT','XRP / USDT','crypto','binance',5,104),
  ('ADAUSD','ADAUSDT','Cardano / USDT','crypto','binance',5,105),
  ('DOGEUSD','DOGEUSDT','Dogecoin / USDT','crypto','binance',6,106),
  ('AVAXUSD','AVAXUSDT','Avalanche / USDT','crypto','binance',3,107),
  ('DOTUSD','DOTUSDT','Polkadot / USDT','crypto','binance',4,108),
  ('LINKUSD','LINKUSDT','Chainlink / USDT','crypto','binance',3,109),
  ('LTCUSD','LTCUSDT','Litecoin / USDT','crypto','binance',2,110),
  ('BCHUSD','BCHUSDT','Bitcoin Cash / USDT','crypto','binance',2,111),
  ('TRXUSD','TRXUSDT','TRON / USDT','crypto','binance',6,112),
  ('UNIUSD','UNIUSDT','Uniswap / USDT','crypto','binance',4,113),
  ('ATOMUSD','ATOMUSDT','Cosmos / USDT','crypto','binance',4,114),
  ('ETCUSD','ETCUSDT','Ethereum Classic / USDT','crypto','binance',3,115),
  ('XLMUSD','XLMUSDT','Stellar / USDT','crypto','binance',5,116),
  ('NEARUSD','NEARUSDT','NEAR Protocol / USDT','crypto','binance',4,117),
  ('APTUSD','APTUSDT','Aptos / USDT','crypto','binance',4,118),
  ('ARBUSD','ARBUSDT','Arbitrum / USDT','crypto','binance',4,119),
  ('OPUSD','OPUSDT','Optimism / USDT','crypto','binance',4,120),
  ('FILUSD','FILUSDT','Filecoin / USDT','crypto','binance',4,121),
  ('INJUSD','INJUSDT','Injective / USDT','crypto','binance',3,122),
  ('SUIUSD','SUIUSDT','Sui / USDT','crypto','binance',4,123),
  ('TONUSD','TONUSDT','Toncoin / USDT','crypto','binance',4,124),
  ('ICPUSD','ICPUSDT','Internet Computer / USDT','crypto','binance',3,125),
  ('AAVEUSD','AAVEUSDT','Aave / USDT','crypto','binance',2,126),
  ('SANDUSD','SANDUSDT','The Sandbox / USDT','crypto','binance',5,127),
  ('PEPEUSD','PEPEUSDT','Pepe / USDT','crypto','binance',8,128),
  ('SHIBUSD','SHIBUSDT','Shiba Inu / USDT','crypto','binance',8,129)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol,
      name = excluded.name,
      category = excluded.category,
      data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;

-- ---------------------------------------------------------------------
-- INDICES & COMMODITIES (provider: yahoo).
-- ---------------------------------------------------------------------
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  ('SPX','^GSPC','S&P 500','indices','yahoo',2,200),
  ('NDX','^NDX','Nasdaq 100','indices','yahoo',2,201),
  ('DJI','^DJI','Dow Jones 30','indices','yahoo',2,202),
  ('FTSE','^FTSE','FTSE 100','indices','yahoo',2,203),
  ('DAX','^GDAXI','DAX 40','indices','yahoo',2,204),
  ('N225','^N225','Nikkei 225','indices','yahoo',2,205),
  ('XAUUSD','GC=F','Gold','commodities','yahoo',2,220),
  ('XAGUSD','SI=F','Silver','commodities','yahoo',3,221),
  ('WTI','CL=F','Crude Oil WTI','commodities','yahoo',2,222),
  ('BRENT','BZ=F','Brent Crude Oil','commodities','yahoo',2,223),
  ('NATGAS','NG=F','Natural Gas','commodities','yahoo',3,224)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol,
      name = excluded.name,
      category = excluded.category,
      data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;

-- ---------------------------------------------------------------------
-- Example OTC pair (disabled until an admin assigns a data provider).
-- ---------------------------------------------------------------------
insert into public.assets
  (symbol, name, category, is_otc, is_enabled, data_provider, price_precision, sort_order, otc_refresh_ms, otc_sessions)
values
  ('EURUSD-OTC', 'EUR/USD OTC', 'otc', true, false, 'otc_custom', 5, 300,
   5000, '[{"day":"sat","open":"00:00","close":"23:59"},{"day":"sun","open":"00:00","close":"23:59"}]'::jsonb)
on conflict (symbol) do nothing;

-- ---------------------------------------------------------------------
-- Default settings.
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
  ('signal_engine', '{"min_confidence":55,"max_signals_per_minute":12}'::jsonb),
  ('market_data',   '{"refresh_seconds":5,"forex_provider":"yahoo","crypto_provider":"binance"}'::jsonb),
  ('branding',      '{"support_telegram":"@devtech77"}'::jsonb)
on conflict (key) do nothing;
