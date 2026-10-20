-- =============================================================================
-- Row Level Security — the actual security boundary.
-- Public (anon) may ONLY insert an inquiry. Everything else is admin-only.
-- =============================================================================

alter table public.admins               enable row level security;
alter table public.inquiries            enable row level security;
alter table public.inquiry_notes        enable row level security;
alter table public.site_images          enable row level security;
alter table public.site_image_history   enable row level security;
alter table public.push_subscriptions   enable row level security;
alter table public.settings             enable row level security;
alter table public.audit_log            enable row level security;

-- helper: is the current request an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- admins
-- -----------------------------------------------------------------------------
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated using (id = auth.uid());

-- NOTE: a policy on public.admins may not query public.admins directly
-- ("infinite recursion detected in policy for relation admins"), so ownership is
-- checked through a security-definer helper.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid() and a.role = 'owner');
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

drop policy if exists "owners manage admins" on public.admins;
create policy "owners manage admins" on public.admins
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "admins update self profile" on public.admins;
create policy "admins update self profile" on public.admins
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- inquiries: anyone can submit, only admins can read/change
-- -----------------------------------------------------------------------------
drop policy if exists "anyone can submit an inquiry" on public.inquiries;
create policy "anyone can submit an inquiry" on public.inquiries
  for insert to anon, authenticated
  with check (
    char_length(name) between 2 and 120
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and char_length(regexp_replace(phone, '\D', '', 'g')) >= 7
    and char_length(coalesce(message, '')) <= 4000
    and status = 'new'
    and is_read = false
  );

drop policy if exists "admins read inquiries" on public.inquiries;
create policy "admins read inquiries" on public.inquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update inquiries" on public.inquiries;
create policy "admins update inquiries" on public.inquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete inquiries" on public.inquiries;
create policy "admins delete inquiries" on public.inquiries
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- inquiry notes
-- -----------------------------------------------------------------------------
drop policy if exists "admins read notes" on public.inquiry_notes;
create policy "admins read notes" on public.inquiry_notes
  for select to authenticated using (public.is_admin());

drop policy if exists "admins write notes" on public.inquiry_notes;
create policy "admins write notes" on public.inquiry_notes
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins delete notes" on public.inquiry_notes;
create policy "admins delete notes" on public.inquiry_notes
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- site images: public read (the website needs them), admin write
-- -----------------------------------------------------------------------------
drop policy if exists "images public read" on public.site_images;
create policy "images public read" on public.site_images
  for select to anon, authenticated using (true);

drop policy if exists "images admin write" on public.site_images;
create policy "images admin write" on public.site_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "image history public read" on public.site_image_history;
create policy "image history public read" on public.site_image_history
  for select to anon, authenticated using (true);

drop policy if exists "image history admin write" on public.site_image_history;
create policy "image history admin write" on public.site_image_history
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- push subscriptions: admin only (an anon visitor must never see endpoints)
-- -----------------------------------------------------------------------------
drop policy if exists "admins manage own subscriptions" on public.push_subscriptions;
create policy "admins manage own subscriptions" on public.push_subscriptions
  for all to authenticated
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- -----------------------------------------------------------------------------
-- settings: public read (contact details are public anyway), admin write
-- -----------------------------------------------------------------------------
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings
  for select to anon, authenticated using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- audit log: admins can read; inserts happen through the service role only
-- -----------------------------------------------------------------------------
drop policy if exists "admins read audit" on public.audit_log;
create policy "admins read audit" on public.audit_log
  for select to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- storage bucket for the site images
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site images public read" on storage.objects;
create policy "site images public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-images');

drop policy if exists "site images admin write" on storage.objects;
create policy "site images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- realtime: let the dashboard subscribe to inquiry changes
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'inquiries'
  ) then
    alter publication supabase_realtime add table public.inquiries;
  end if;
end $$;
