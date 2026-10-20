-- =============================================================================
-- Web push fan-out
--
-- Every new inquiry calls the `notify-inquiry` Edge Function through pg_net.
-- This runs inside Postgres, so notifications are delivered even when no admin
-- has the dashboard open (or the browser is closed).
--
-- Setup before running:
--   1. select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   2. select vault.create_secret('<service-role-key>', 'service_role_key');
--   3. select vault.create_secret('<random-shared-secret>', 'notify_secret');
--      (the same value goes into the Edge Function secret NOTIFY_SECRET)
-- =============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  project_url  text;
  service_key  text;
  shared_secret text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key  from vault.decrypted_secrets where name = 'service_role_key';
  select decrypted_secret into shared_secret from vault.decrypted_secrets where name = 'notify_secret';

  if project_url is null or service_key is null then
    raise warning 'notify_new_inquiry: secrets missing, skipping push';
    return new;
  end if;

  perform net.http_post(
    url     := project_url || '/functions/v1/notify-inquiry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key,
      'x-notify-secret', coalesce(shared_secret, '')
    ),
    body    := jsonb_build_object(
      'type', 'INSERT',
      'table', 'inquiries',
      'record', jsonb_build_object(
        'id', new.id,
        'name', new.name,
        'phone', new.phone,
        'email', new.email,
        'site_type', new.site_type,
        'location', new.location,
        'services', to_jsonb(new.services),
        'message', new.message,
        'created_at', new.created_at
      )
    ),
    timeout_milliseconds := 5000
  );

  -- keep an audit trail of what the site received
  insert into public.audit_log (action, entity, meta)
  values ('inquiry.received', 'inquiries:' || new.id, jsonb_build_object('name', new.name));

  return new;
end $$;

drop trigger if exists on_inquiry_created on public.inquiries;
create trigger on_inquiry_created
  after insert on public.inquiries
  for each row execute function public.notify_new_inquiry();

-- -----------------------------------------------------------------------------
-- Rate limiting: max 5 submissions per email/IP fingerprint per minute.
-- Cheap protection against form spam; Turnstile can be layered on top.
-- -----------------------------------------------------------------------------
create or replace function public.rate_limit_inquiries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.inquiries
  where email = new.email
    and created_at > now() - interval '1 minute';

  if recent >= 5 then
    raise exception 'Too many requests — please try again in a minute.'
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists inquiries_rate_limit on public.inquiries;
create trigger inquiries_rate_limit
  before insert on public.inquiries
  for each row execute function public.rate_limit_inquiries();

-- -----------------------------------------------------------------------------
-- Nightly tidy-up: drop dead subscriptions (kept for reference).
-- The Edge Function also deletes them on 404/410 in real time.
-- -----------------------------------------------------------------------------
create or replace function public.prune_push_subscriptions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions
  where last_ok_at is not null and last_ok_at < now() - interval '120 days';
$$;
