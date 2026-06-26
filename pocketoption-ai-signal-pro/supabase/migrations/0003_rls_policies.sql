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
