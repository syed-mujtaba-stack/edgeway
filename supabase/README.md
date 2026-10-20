# Supabase setup

> **This project is already live** — see [`../../docs/live-deployment.md`](../../docs/live-deployment.md)
> for the deployed project ref, keys, applied migrations and verification results. The steps below
> are for standing up a *second* environment (staging, another client) from scratch.

The dashboard runs out of the box in **demo mode** (local data). Follow these
steps to switch it to the real backend: Postgres, storage, auth, realtime and
push that works with the browser closed.

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project** (region: closest to California).
2. Project Settings → **API** → copy:
   * `Project URL` → `VITE_SUPABASE_URL`
   * `anon public` key → `VITE_SUPABASE_ANON_KEY`

Put both in `.env` in the project root, then restart `npm run dev`.

## 2. Create the schema

```bash
npm i -g supabase           # or: npx supabase <command>
supabase login
supabase link --project-ref <your-ref>
supabase db push            # runs supabase/migrations/*.sql in order
```

Or paste the three files in `supabase/migrations/` into the SQL editor in order.

This creates: `admins`, `inquiries`, `inquiry_notes`, `site_images`,
`site_image_history`, `push_subscriptions`, `settings`, `audit_log`, plus the
`site-images` storage bucket, all RLS policies, the realtime publication and the
spam/rate-limit trigger.

## 3. Create the first admin

1. Authentication → **Users** → *Add user* (email + password, "auto confirm").
2. Copy the user's UUID, then in SQL:

```sql
insert into public.admins (id, full_name, role)
values ('<user-uuid>', 'Your Name', 'owner');
```

3. Sign in at `/admin/login` with that email and password.

> Anyone can authenticate, but only rows in `public.admins` pass `is_admin()` —
> so a random sign-up sees nothing.

## 4. VAPID keys for web push

```bash
npx web-push generate-vapid-keys
```

* **Public** key → `.env` as `VITE_VAPID_PUBLIC_KEY`
* **Private** key → Edge Function secret only (never in the repo or `.env`)

## 5. Deploy the Edge Function

```bash
supabase functions deploy notify-inquiry --no-verify-jwt
supabase secrets set \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:info@edgewaysecurity.com \
  NOTIFY_SECRET=$(openssl rand -hex 24)
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Optional email copy (Resend free tier):

```bash
supabase secrets set RESEND_API_KEY=re_... NOTIFY_EMAIL=info@edgewaysecurity.com
```

## 6. Connect the database trigger

The trigger needs three secrets in **Vault** (SQL editor):

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>', 'service_role_key');
select vault.create_secret('<same NOTIFY_SECRET value>', 'notify_secret');
```

Then run `supabase/migrations/0003_notify_trigger.sql` (or re-run it) and insert
a test row:

```sql
insert into public.inquiries (name, email, phone, services, site_type, location, message)
values ('Test Lead', 'test@example.com', '(555) 123-4567', array['Cameras'], 'Warehouse', 'Los Angeles, CA', 'Testing push');
```

You should see a notification on every registered device within a second or two,
and the row appear in the dashboard with no refresh.

## 7. Verify the security boundary

```sql
-- as anon (run in the SQL editor with the anon role, or via the REST API)
select * from public.inquiries;   -- must return zero rows / permission denied
```

Only inserts are allowed for `anon`. Reads, updates and deletes require an admin
session.

## Notes

* Free tier: 500 MB database, 1 GB storage, 5 GB egress — plenty for this site.
  Free projects pause after 7 days of inactivity; use Pro ($25/mo) for a live
  business site.
* Backups: daily on free (7 days). Export from Settings in the dashboard any time.
* iOS: push requires the PWA to be installed (Share → Add to Home Screen), iOS 16.4+.
