# Build report — admin dashboard, PWA, web push

> **Live backend:** this app is now connected to the Supabase project `edgeway-security`
> (`cavxvcyaaamqnirtomci`). Keys, migrations, Edge Function, admin login and the end-to-end
> verification matrix are in [`../../docs/live-deployment.md`](../../docs/live-deployment.md).

**Delivered:** 20 Oct 2026 · built on top of the approved React + TypeScript site
(`edgeway-react/`). Design of the public site is unchanged — re-verified pixel-perfect after
all of this work (0.00% diff at 1280px, 0.002% at 390px).

---

## What is live right now

The app runs **with no configuration at all** — `npm run dev` → open `/admin`:

| | |
|---|---|
| URL | `http://localhost:5173/admin` |
| Email | any (e.g. `admin@edgewaysecurity.com`) |
| Password | any, 4+ characters (e.g. `edgeway123`) |
| Mode | **Demo** — data lives in this browser (localStorage + IndexedDB) |

Demo mode is not a mock of the screens: it is the same UI talking to a local implementation of the
same backend contract. Realtime, uploads, offline queue and notifications all genuinely work.

---

## Feature checklist

### Admin dashboard (mobile-first, PWA)

* [x] Email/password login, protected routes, session persistence, sign out
* [x] Overview: unread / today / this week / quoted counters + latest requests
* [x] Inquiries inbox: realtime, search, status filters, unread badges, CSV export
* [x] Inquiry detail: full request, one-tap Call / WhatsApp / Email / copy phone
* [x] Status workflow New → Contacted → Quoted → Won / Lost / Spam (optimistic)
* [x] Notes per lead (who + when)
* [x] Delete with confirmation
* [x] Unread count mirrored in the browser tab title
* [x] Mobile bottom tab bar, full-width sheets, 44px targets, safe-area insets
* [x] Same brand system as the site (paper / navy / gold, Gloock + Instrument Sans)

### Image management

* [x] 8 slots: home hero, guards, cameras, patrol, dispatch, control room, night patrol, logo
* [x] Drag & drop or file picker, up to 12 MB, JPG/PNG/WebP/AVIF
* [x] Automatic conversion to the two sizes the site serves (1200w + 2400w WebP), EXIF stripped
* [x] Alt text editing, live preview, default vs custom badge, who/when metadata
* [x] Version history with restore, and “reset to original”
* [x] Public site picks the new image on next load; bundled defaults are the fallback

### Inquiries pipeline

* [x] Public form writes to the backend (not just an email)
* [x] Realtime row + toast in the dashboard (~1 s), across tabs too
* [x] Offline: submission queued in IndexedDB, flushed automatically on reconnect
* [x] Final fallback to mailto so a lead can never be lost
* [x] Rate limit + validation (server-side too, in RLS)

### PWA

* [x] `manifest.webmanifest` (site) and `admin-manifest.webmanifest` (dashboard, start `/admin`)
* [x] Icons 192/512/maskable + apple-touch + favicon
* [x] Service worker: app-shell precache, cache-first images, SWR assets, network-first pages,
      `/offline.html` fallback
* [x] Verified: registered + shell cached; uncached route → offline page; cached route → loads
* [x] Custom install prompt on the public site; install instructions in the dashboard

### Web push

* [x] Permission flow + per-device registration + device list + test notification
* [x] `push`, `notificationclick` (deep link to the inquiry) and `pushsubscriptionchange` handlers
* [x] Live mode: DB trigger → Edge Function → VAPID fan-out, dead endpoints pruned (404/410)
* [x] Optional Resend email copy alongside push
* [x] iOS guidance baked into the UI (install to home screen is required by Apple)

### Backend (Supabase)

* [x] Schema: admins, inquiries, inquiry_notes, site_images, site_image_history,
      push_subscriptions, settings, audit_log
* [x] RLS: anon can **only insert** an inquiry; reads/updates/deletes are admin-only
* [x] Storage bucket `site-images` (public read, admin write)
* [x] Realtime publication for `inquiries`
* [x] Triggers: `updated_at`, rate limit, push fan-out
* [x] Edge Function `notify-inquiry` (Deno + web-push)
* [x] 10-minute setup guide: `supabase/README.md`

---

## How to verify (5 minutes, demo mode)

1. `npm run dev` → open `/admin` → sign in with any email + `edgeway123`.
2. Open `/contact` in a second tab, submit the form.
   → the dashboard row appears immediately, toast fires, tab title shows `(1)`, and a browser
   notification appears (allow it from **Notifications** first).
3. **Images** → *Home hero* → **Replace** → drop a photo → **Save & publish** → open `/`.
   → the new hero is live. **Reset** puts the original back.
4. Open a lead → change status, add a note, press **CSV**.
5. DevTools → Application → *Service workers* / *Manifest* to see the PWA, or install it from the
   address-bar icon.
6. Go offline (DevTools → Network → Offline) and submit the form → “You’re offline — we saved your
   request”; go back online → it sends itself.

---

## To go live (client's 10 minutes)

1. Create the Supabase project → copy URL + anon key into `.env`.
2. `supabase db push` (schema + RLS + triggers).
3. Create the first admin user, insert the matching row in `public.admins`.
4. `npx web-push generate-vapid-keys` → public key in `.env`, private key in the Edge Function.
5. `supabase functions deploy notify-inquiry` + set the three Vault secrets.
6. Deploy to Vercel (config already in `vercel.json`), point `edgewaysecurity.com` at it.

Full steps: [`supabase/README.md`](../supabase/README.md). Day-to-day instructions for the client:
[`admin-guide.md`](admin-guide.md).

---

## Numbers

| Item | Value |
|---|---|
| Public bundle | 229 kB raw / **73 kB gzip** JS + 7 kB gzip CSS (admin not included) |
| Admin bundle (lazy) | 42 kB raw / **12 kB gzip** JS + 4 kB gzip CSS |
| Supabase chunk (lazy) | 8 kB — never shipped to public visitors |
| Public site pixel diff vs approved design | 0.00% desktop · 0.002% mobile |
| Type check | `tsc --noEmit` clean |
| Console | no errors on any route |

---

## Known limits (by design)

* **iOS push** only works for the PWA installed to the home screen (Apple rule, iOS 16.4+).
  The UI explains this where it matters.
* **Push delivery timing** is ultimately the OS's choice — the dashboard realtime update and the
  optional email copy exist so a lead is never missed.
* **Demo mode data is per browser**; clearing site data resets it. Live mode has no such limit.
* **Image slots are fixed** (8). Adding a new editable image later = one entry in
  `src/data/imageSlots.ts` + a `slot="…"` on the image — no schema change.
* **Supabase free tier** pauses after 7 days of inactivity; Pro ($25/mo) for a live business site.

**Update (20 Oct 2026):** permanent delete added — per-row bin icon in the list, a toolbar
`Delete N` button after selecting rows, and the existing detail-page danger zone. All three go
through `repo.deleteInquiries(ids)` → one `DELETE ... in (ids)` call, optimistic UI with rollback,
confirmed with a red alert bar. Verified end-to-end on the live site (3 → delete 1 → select all →
delete 2 → 0 rows, notes cascade, DB empty afterwards).

## Mobile pass — 20 Oct 2026

Automated sweep over every route at 320 / 360 / 390 / 414 / 768 / 1024 / 1280 / 1440 px, checking
`document.scrollWidth` and every element's right edge. Fixed:

| Where | Problem | Fix |
| --- | --- | --- |
| Inquiries filters | 6 status chips ran off-screen on phones (unreachable) | chips wrap onto multiple rows under 44rem */
| Inquiries rows | row grid `auto 1fr auto` let long site/location strings widen the page (64px overflow at 390, 134px at 320) | `minmax(0, 1fr)` column, `min-width: 0` on list items, one-line ellipsis on the meta line |
| Notifications | device rows overflowed by 49px at 320px | rows wrap, meta line flexes, delete button stays on the right |
| Overview | "Push notifications on this device" label squeezed to 3 characters | stacks copy above the button under 26rem |
| Public home | service tabs clipped the last tab at 320–360px | tab strip scrolls, tighter padding under 23rem |
| Settings | long email could not break | `overflow-wrap: anywhere` on key/value values |

Result: **no horizontal overflow on any route at any of the 8 widths** (the only remaining item is
a 9px scroll inside the tab strip at 320px, which is intentional — `document` itself does not
overflow). Verified on the deployed site as well.
