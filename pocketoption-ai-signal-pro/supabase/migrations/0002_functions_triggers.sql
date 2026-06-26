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
