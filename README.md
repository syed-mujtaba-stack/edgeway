# Edgeway Security Inc. — React + TypeScript

A 1:1 rebuild of the approved Edgeway Security static site as a **React 18 + TypeScript + Vite**
application, plus a **realtime admin dashboard, PWA and web push**.

* Public site — same design, layout, colours, copy, images and fonts as the approved original
  (verified pixel-for-pixel at 1280px and 390px on all four pages).
* Admin dashboard at `/admin` — live inquiries, image management, push notifications, settings.
* Works with **zero configuration**: with no keys it runs in *demo mode* (local data, simulated
  realtime, browser notifications). Add Supabase keys to go live.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173   (site + /admin)
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build → http://localhost:4173
npm run typecheck  # tsc --noEmit only
```

Node 18+ required.

### Demo credentials

With no `.env` the dashboard runs on local demo data:

* URL: `/admin`
* Any email + any password (4+ characters) — e.g. `admin@edgewaysecurity.com` / `edgeway123`
* Seeded inquiries, working statuses, notes, CSV, image upload (stored in IndexedDB),
  real-time updates between tabs, notification permission + test notifications.

### Live backend (already deployed)

The project ships pointing at a live Supabase project (`edgeway-security`,
`https://cavxvcyaaamqnirtomci.supabase.co`) — credentials are in `.env` (git-ignored). With them
present the dashboard shows **Supabase live** in the sidebar and everything is real: Postgres,
Auth, Storage, Realtime and VAPID web push. Remove/rename `.env` to fall back to demo mode.

Live admin login: `admin@edgewaysecurity.com` / `Edgeway2026!` (change it after first login).

Full details, keys, verification results and the remaining go-live checklist:
[`../docs/live-deployment.md`](../docs/live-deployment.md). To point the app at a *different*
Supabase project instead, follow [`supabase/README.md`](supabase/README.md).

---

## What changed (and what deliberately did not)

| | Static site | This app |
|---|---|---|
| Pages | 4 hand-written `.html` files, duplicated header/footer | 4 routes via React Router, one shared `<Layout>` |
| Content | Hard-coded in each HTML file | One typed data file (`src/data/site.tsx`) |
| Interaction | `main.js` DOM queries (tabs, menu, reveal, form) | React state + hooks, same behaviour |
| Styling | `main.css` | The **same** `main.css`, imported unchanged as `src/styles/global.css` |
| Fonts | Self-hosted `assets/fonts/*.woff2` | Same files in `public/assets/fonts/` |
| Images | `assets/img/*` | Same files in `public/assets/img/` |
| Build | None (static upload) | Vite, typed, minified, hashed assets |
| Quote form | mailto fallback, optional `data-endpoint` | Same, plus `VITE_QUOTE_ENDPOINT` env option |

Nothing in the visual layer was rewritten: no CSS-in-JS, no Tailwind, no component-library theme.
The colour tokens (`--paper #f3efe6`, `--ink #0a1230`, `--navy #000b33`, `--night #00001a`,
`--gold #d7a826`, `--gold-deep #ce982b`), the Gloock/Instrument Sans pairing, the container widths,
the motion curves and the reveal-on-scroll timing are all still defined exactly once, in
`src/styles/global.css`. The only edit to that file is the two `@font-face` URLs, which now point at
`/assets/fonts/…` (the public folder) instead of the relative `assets/fonts/…`.

---

## Admin dashboard

`/admin` is a separate route tree (lazy-loaded, its own stylesheet) — visitors never download it.

| Page | What it does |
|---|---|
| `/admin` | Overview: unread / today / week / quoted counters, latest requests, quick actions |
| `/admin/inquiries` | Live inbox: search, status filters, CSV export, unread badges |
| `/admin/inquiries/:id` | Full request, one-tap Call / WhatsApp / Email / copy, status, notes, delete |
| `/admin/images` | Eight editable image slots — upload, auto-WebP (1200w + 2400w), alt text, history, reset |
| `/admin/notifications` | Enable push per device, device list, send test, install instructions |
| `/admin/settings` | Business details, account, JSON export |

Design language is the same brand system (paper `#f3efe6`, navy `#000b33`, gold `#d7a826`),
with a sidebar on desktop and a bottom tab bar on phones. Mobile is a first-class target: card
lists instead of tables, full-width sheets for detail, 44px touch targets, safe-area padding.

### Backend contract

`src/lib/repo/` defines one `Repo` interface with two implementations:

* **demo** (`demo.ts`) — localStorage + IndexedDB + BroadcastChannel; realtime is simulated, so
  two tabs stay in sync exactly like the live system.
* **supabase** (`supabase.ts`) — Postgres, Storage, Auth, Realtime.

Everything in the UI is written against the interface, so switching backends is an env change, not
a refactor. The Supabase client is imported lazily, so it is *not* in the public bundle.

### Inquiries, live

* Insert → dashboard row + toast + unread badge within ~1s (`postgres_changes` in live mode,
  BroadcastChannel in demo mode).
* Unread count mirrored into the tab title (`(3) Edgeway Admin`).
* Status workflow `new → contacted → quoted → won / lost / spam`, notes per lead, CSV export.
* The public form writes to the backend first; if the network is down it queues in IndexedDB and
  flushes automatically on reconnect. Final fallback is still the mailto link, so no lead is lost.

### Images

Eight slots (hero, guards, cameras, patrol, dispatch, control room, night patrol, crest). Uploads
are re-encoded in the browser to WebP at 1200w and 2400w — the exact sizes the site already
served — with alt text, version history, restore and “reset to default”. The public site resolves
each `<ResponsiveImage>` against the slot map and silently falls back to the bundled original if
anything is unreachable.

### PWA + web push

* `public/sw.js` — app-shell precache, cache-first images, stale-while-revalidate assets,
  network-first navigations with an `/offline.html` fallback, `push`,
  `notificationclick` (deep-links to the inquiry) and `pushsubscriptionchange` handlers.
* `public/manifest.webmanifest` for the site, `public/admin-manifest.webmanifest` for the installed
  admin app (start URL `/admin`, navy theme).
* Push: VAPID keys → `push_subscriptions` → a Postgres trigger calls the
  `notify-inquiry` Edge Function, which fans out with `web-push` and prunes dead endpoints
  (404/410). Delivery therefore happens **even when no dashboard is open**.
* iOS note: push requires the PWA to be installed (Share → Add to Home Screen, iOS 16.4+).

### Supabase assets

```
supabase/
├── migrations/0001_schema.sql        tables, indexes, triggers, image slot seed
├── migrations/0002_rls.sql           RLS policies, storage bucket, realtime publication
├── migrations/0003_notify_trigger.sql push fan-out + rate limiting
├── functions/notify-inquiry/         Edge Function (VAPID web push, optional Resend email)
└── README.md                         10-minute setup, Vault secrets, verification steps
```

---

## Structure

```
edgeway-react/
├── index.html                 # single entry document (meta defaults, favicons, font preloads)
├── vite.config.ts             # dev/preview on 0.0.0.0, "@" → src alias, css in assets/css
├── vercel.json                # SPA rewrites + CSP/security headers (mirrors the old site)
├── tsconfig.json              # strict TypeScript
├── .env.example               # optional quote-form endpoint
├── public/
│   ├── assets/img/            # 16 original images (1200w + 2400w webp set, png crest/icons)
│   ├── assets/fonts/          # Gloock + Instrument Sans woff2
│   ├── icons/                 # PWA icons (192/512/maskable/apple-touch/favicon)
│   ├── manifest.webmanifest   # PWA manifest — public site
│   ├── admin-manifest.webmanifest
│   ├── sw.js                  # service worker: offline shell + web push
│   ├── offline.html
│   └── robots.txt
└── src/
    ├── main.tsx               # createRoot + BrowserRouter
    ├── App.tsx                # route table
    ├── styles/global.css      # the approved design system (unchanged)
    ├── data/site.tsx          # company details, services, sectors, FAQ, form options, images
    ├── lib/seo.ts             # per-route title / description / Open Graph
    ├── hooks/index.ts         # useReveal, useScrolled, useMediaQuery, usePrefersReducedMotion
    ├── admin/                 # dashboard (lazy-loaded)
    │   ├── AdminApp.tsx       # /admin routes + manifest swap + admin.css
    │   ├── state.tsx          # session, realtime inquiries, toasts, unread title
    │   ├── admin.css          # admin-only styles
    │   ├── auth/              # Login, RequireAuth
    │   ├── layout/AdminShell   # sidebar, mobile tabs, toasts
    │   ├── pages/             # Overview, Inquiries, InquiryDetail, Images, Notifications, Settings
    │   ├── components/         # StatusPill, icons
    │   └── hooks/usePush.ts   # permission, subscription, devices, test send
    ├── context/SiteImages.tsx # image slot overrides for the public site
    ├── lib/
    │   ├── repo/              # backend contract: demo.ts, supabase.ts, types.ts
    │   ├── supabaseClient.ts   # lazy singleton
    │   ├── imagePipeline.ts   # canvas → 1200/2400 WebP
    │   ├── inquiries.ts       # submit + offline queue + flush
    │   ├── idb.ts             # IndexedDB wrapper
    │   ├── notify.ts          # permission + local notifications
    │   ├── pwa.ts             # SW registration, install prompt
    │   ├── format.ts          # dates, CSV, download
    │   └── env.ts             # demo/supabase switch
    ├── types/db.ts            # domain types
    ├── components/
    │   ├── Layout.tsx         # TopBar + Header + main + Footer + scroll/hash manager
    │   ├── InstallPrompt.tsx  # PWA install nudge
    │   ├── Header.tsx         # sticky header, mobile menu (Escape, auto-close, aria)
    │   ├── Footer.tsx
    │   ├── Cta.tsx            # the "Tell Us About Your Site" band
    │   ├── ServicesTabs.tsx   # ARIA tablist, ?service= deep links, arrow-key support
    │   ├── QuoteForm.tsx      # validated quote request form
    │   └── primitives.tsx     # Reveal, ResponsiveImage, LinkArrow/NavArrow, Arrow, FAQList
    └── pages/
        ├── Home.tsx
        ├── Services.tsx
        ├── Industries.tsx
        ├── Contact.tsx
        └── NotFound.tsx       # 404 (the static site had none)
```

### Routes

| URL | Page |
|---|---|
| `/` | Home |
| `/services` (+ `#guards`, `#cameras`, `#patrol`) | Services |
| `/industries` (+ `#commercial`, `#industrial`, `#institutional`) | Industries |
| `/contact` (+ `#quote`, `#faq`) | Contact & quote form |
| `/admin`, `/admin/inquiries`, `/admin/images`, `/admin/notifications`, `/admin/settings` | Dashboard |
| anything else | 404 page |

Query-string behaviour from the old site is preserved:

* `/?service=cameras` opens the home page with the Cameras tab selected.
* `/contact?service=guards` pre-ticks “Security Guards” in the quote form.
* Tab clicks still write `?service=…` with `replaceState`, so the URL stays shareable.

---

## Behaviour carried over

* **Sticky header** gets `is-scrolled` past 8px (`useScrolled`).
* **Mobile menu** — `aria-expanded`, `Menu`/`Close` label, closes on Escape (focus returns to the
  button), on link click, and when the viewport passes 52rem.
* **Reveal on scroll** — the original `[data-reveal]` / `[data-d="1|2|3"]` classes and timings are
  reproduced by a `<Reveal>` component backed by `IntersectionObserver`; disabled entirely under
  `prefers-reduced-motion: reduce`.
* **Services tablist** — real `role="tab"` / `role="tabpanel"`, `aria-selected`, roving `tabindex`,
  ArrowLeft/ArrowRight/Home/End keyboard support.
* **FAQ** — native `<details>/<summary>` with the same plus/minus icon.
* **Quote form** — same fields, same optgroups, same copy, same inline error messages
  (name / email / 10-digit phone), same “don’t lose my input” beforeunload guard, same mailto
  fallback that opens the visitor’s email app with a filled-in request.
* **Anchor scrolling** — `#quote`, `#faq`, `#cameras` etc. scroll under the sticky header
  (`scroll-padding-top` in CSS) and reset to top on route change.
* **Per-page `<title>`, description and Open Graph tags** are set by `<Seo>` on every route.

Accessibility and reduced-motion behaviour are unchanged; the mobile screenshots match the original
line for line, which is a good proxy for type scale and rhythm.

---

## Quote form: wiring a backend (optional)

Out of the box the form behaves like the static site — it opens the visitor’s mail client.
To POST to a server instead:

```bash
cp .env.example .env
# .env
VITE_QUOTE_ENDPOINT=https://formspree.io/f/your-id
```

The form then sends `FormData` (`name`, `company`, `email`, `phone`, `services`, `site`, `timing`,
`location`, `message`) and treats any 2xx as success, with the same success/error copy as before.
If you use your own API, add its origin to `connect-src` in `vercel.json`.

---

## Deployment

**Vercel** — import the repo, framework preset “Vite”; `vercel.json` already sets the build command,
output directory, SPA rewrites and the security headers (CSP, nosniff, referrer policy) that the old
static host used.

**Any static host / nginx** — upload `dist/`, and rewrite unknown paths to `/index.html` so the
client-side routes resolve:

```nginx
location / { try_files $uri $uri/ /index.html; }
```

Assets in `/assets/img` and `/assets/fonts` are content-stable, so they can be given a long
`Cache-Control` (Vercel config already does).

---

## Visual parity

Both versions were rendered head-to-head in Chromium and diffed. Residual difference is font
antialiasing only (0.00–0.01% of pixels above threshold).

| Page | Desktop 1280px | Mobile 390px |
|---|---|---|
| Home | 0.00% | 0.002% |
| Services | 0.005% | 0.002% |
| Industries | 0.001% | 0.002% |
| Contact | 0.02% | 0.043% |

Side-by-side captures of the check are in `docs/`:

* `docs/parity-home-desktop.png`
* `docs/parity-home-mobile.png`
* `docs/parity-services-desktop.png`

---

## Testing done

* Public site: pixel diff vs the approved static build — 0.00% at 1280px, 0.002% at 390px
  (font antialiasing only), re-verified after the admin/PWA work.
* Inquiries: form → storage → dashboard row + toast + tab badge; cross-tab realtime verified with
  a lead submitted in one tab and the inbox updating in another.
* Images: upload → WebP conversion (1200w + 2400w) → live on the public site → reset to default.
* Offline: uncached page → `/offline.html`; cached page still loads; form submitted offline is
  queued in IndexedDB and flushed automatically on reconnect.
* Builds clean: `tsc --noEmit` + `vite build`; no console errors on any route.

---

## Notes / follow-ups for the client

* The street address is still a placeholder — `TODO` in `src/data/site.tsx` (`company.address`),
  same as the static version.
* Content edits now happen in one place: `src/data/site.tsx`. Adding a service, sector item, FAQ or
  nav link means adding one object, not editing four HTML files.
* Currently rendered client-side. If organic SEO on deep URLs matters (it usually does for a
  service business), the next step would be prerendering the routes to static HTML — the app
  structure already supports it (react-router + Vite SSR/prerender) without touching the design.
* Optional but recommended for a live site: Cloudflare Turnstile on the public form (the RLS +
  rate limit already block the obvious junk), and Resend email alerts alongside push.
* Client-facing instructions live in [`docs/admin-guide.md`](docs/admin-guide.md).
