-- =============================================================================
-- Edgeway Security — schema for the admin dashboard
-- Run with:  supabase db push     (or paste into the SQL editor)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- admins: profiles for auth.users that are allowed into the dashboard
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default 'Admin',
  role        text not null default 'admin' check (role in ('owner', 'admin', 'viewer')),
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- inquiries: every contact-form submission
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'inquiry_status') then
    create type public.inquiry_status as enum ('new', 'contacted', 'quoted', 'won', 'lost', 'spam');
  end if;
end $$;

create table if not exists public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  company        text,
  email          text not null,
  phone          text not null,
  services       text[] not null default '{}',
  site_type      text,
  timing         text,
  location       text,
  message        text,
  status         public.inquiry_status not null default 'new',
  is_read        boolean not null default false,
  source         text not null default 'website',
  submission_id  text unique,               -- makes offline re-sends idempotent
  utm            jsonb,
  user_agent     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_unread_idx on public.inquiries (is_read) where is_read = false;

create table if not exists public.inquiry_notes (
  id           bigserial primary key,
  inquiry_id   uuid not null references public.inquiries (id) on delete cascade,
  body         text not null,
  author_id    uuid references public.admins (id) on delete set null,
  author_name  text,
  created_at   timestamptz not null default now()
);

create index if not exists inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at);

-- -----------------------------------------------------------------------------
-- images: one row per editable slot on the site
-- -----------------------------------------------------------------------------
create table if not exists public.site_images (
  slot              text primary key,
  path_2400         text,
  path_1200         text,
  width             int,
  height            int,
  alt               text not null default '',
  version           int not null default 0,
  updated_by        uuid references public.admins (id) on delete set null,
  updated_by_name   text,
  updated_at        timestamptz not null default now()
);

create table if not exists public.site_image_history (
  id               bigserial primary key,
  slot             text not null references public.site_images (slot) on delete cascade,
  storage_path     text not null,
  alt              text not null default '',
  created_by       uuid references public.admins (id) on delete set null,
  created_by_name  text,
  created_at       timestamptz not null default now()
);

create index if not exists site_image_history_slot_idx
  on public.site_image_history (slot, created_at desc);

-- -----------------------------------------------------------------------------
-- web push subscriptions (one row per device per admin)
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          bigserial primary key,
  admin_id    uuid not null references public.admins (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  device      text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);

-- -----------------------------------------------------------------------------
-- settings: single row of business details used across the site
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  id             int primary key default 1 check (id = 1),
  phone_display  text not null default '(747) 370-4640',
  phone_href     text not null default 'tel:+17473704640',
  email          text not null default 'info@edgewaysecurity.com',
  address_line1  text not null default '[Street Address]',
  address_line2  text not null default '[City], CA [ZIP]',
  ppo            text not null default 'PPO #122631',
  notify_email   text not null default 'info@edgewaysecurity.com',
  updated_at     timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict do nothing;

-- -----------------------------------------------------------------------------
-- audit log — who changed what
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid references public.admins (id) on delete set null,
  actor_name  text,
  action      text not null,
  entity      text not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- seed the image slots so the dashboard has cards to render
-- (paths stay null → the public site keeps using its bundled originals)
-- -----------------------------------------------------------------------------
insert into public.site_images (slot, alt)
values
  ('hero',           'Four security officers in black Security jackets standing side by side'),
  ('service_guards', 'Close-up of a security officer’s jacket with a gold Security patch'),
  ('service_cameras','Technician mounting an outdoor security camera on a wall'),
  ('service_patrol', 'Roof of a white patrol vehicle with an amber light bar'),
  ('dispatch',       'Dispatcher watching a wall of live security camera feeds'),
  ('control_room',   'Security control room with rows of monitors showing camera feeds'),
  ('night_patrol',   'Security officer walking along a lit perimeter fence at night'),
  ('crest',          'Edgeway Security crest')
on conflict (slot) do nothing;

-- -----------------------------------------------------------------------------
-- updated_at bookkeeping
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists inquiries_touch on public.inquiries;
create trigger inquiries_touch
  before update on public.inquiries
  for each row execute function public.touch_updated_at();
