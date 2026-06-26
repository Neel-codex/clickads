-- =====================================================================
-- 0005 - Bootstrap admin
-- Grants super_admin to one or more bootstrap emails.
-- Works in BOTH directions:
--   1. Promotes the account immediately if it already exists.
--   2. Auto-promotes the account on sign-up if it registers later
--      (handle_new_user checks the bootstrap list).
-- Edit the email list below to suit. Idempotent: safe to re-run.
-- =====================================================================

-- 1) Store the bootstrap admin emails (lowercased) in settings.
insert into public.settings (key, value)
values ('bootstrap_admin_emails', '["nivaranibora8@gmail.com"]'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 2) Promote the account now if it has already signed up.
update public.profiles
set role = 'super_admin'
where lower(email) in (
  select lower(jsonb_array_elements_text(value))
  from public.settings
  where key = 'bootstrap_admin_emails'
);

-- 3) Recreate handle_new_user so future sign-ups in the list become super_admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_admins jsonb;
  v_role user_role := 'user';
begin
  select value into v_admins from public.settings where key = 'bootstrap_admin_emails';
  if v_admins is not null and v_admins ? lower(new.email) then
    v_role := 'super_admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
