# Edgeway — local laptop par chalane ka tareeqa

Yeh folder website + admin dashboard ka **poora React + TypeScript source** hai
(Vite build, Supabase backend, PWA aur Android/Capacitor project ke saath).

---

## 1. Requirements

* **Node.js 18 ya us se naya** (Node 20/22 behtar hai) — https://nodejs.org
  Check: `node -v` aur `npm -v`
* (Sirf Android app banane ke liye) **JDK 17** + **Android Studio / Android SDK 34**
* Internet connection (fonts/images local hain, lekin `npm install` aur live inquiries ke liye chahiye)

## 2. Install

```bash
cd edgeway-react
npm install
```

## 3. Chalayein

```bash
npm run dev
```

* Website → **http://localhost:5173**
* Admin dashboard → **http://localhost:5173/admin**

Agar 5173 busy ho to Vite khud 5174 de dega — terminal mein likha URL khol lein.

### Login (live Supabase)
```
Email:    admin@edgewaysecurity.com
Password: Edgeway2026!
```

## 4. Baaki commands

| Command | Kaam |
| --- | --- |
| `npm run dev` | dev server (hot reload) |
| `npm run build` | type-check + production build → `dist/` |
| `npm run preview` | production build ko locally serve kare → http://localhost:4173 |
| `npm run typecheck` | sirf TypeScript check |
| `npm run android:sync` | web build ko Android project mein copy |
| `npm run android:apk` | signed release APK banaye |

## 5. Demo mode (Supabase ke baghair)

`.env` file ka naam badal dein (ya delete karein):

```bash
mv .env .env.backup
npm run dev
```

Ab dashboard **demo data** par chalega — local inquiries, simulated realtime, browser
notifications. Demo login: `/admin` par jo credentials login screen par likhe hain (README
mein bhi hain). `.env` wapas rakhne par live Supabase data aa jayega.

## 6. `.env` (live backend)

```env
VITE_SUPABASE_URL=https://cavxvcyaaamqnirtomci.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_VAPID_PUBLIC_KEY=<public key>
VITE_QUOTE_ENDPOINT=
```

* Anon key public hoti hai (browser mein jati hai) — asli security Supabase RLS se aati hai.
* **Service-role key kabhi** is folder mein na rakhein.
* Web push ke liye browser ko HTTPS ya `localhost` chahiye — `localhost` chalega.

## 7. Folder structure

```
edgeway-react/
├─ src/
│  ├─ pages/            public site pages (Home, Services, Industries, Contact)
│  ├─ components/       header, footer, sections, images
│  ├─ admin/            dashboard (pages, state, admin.css)
│  ├─ lib/              supabase client, repo, pwa, native (Capacitor)
│  ├─ context/          site images provider
│  └─ styles/           global.css — approved design
├─ public/              images, fonts, icons, manifest
├─ scripts/             fetch-assets.mjs (Vercel ke liye assets)
├─ supabase/            SQL migrations + Edge Function (notify-inquiry)
├─ android/             Capacitor Android project (+ signing keystore)
├─ docs/                admin-guide, build-report, android-app, screenshots
├─ capacitor.config.ts
├─ vite.config.ts
└─ package.json
```

## 8. Deploy

```bash
npx vercel --prod          # Vercel CLI, isi folder se
```
Live site: https://edgeway-security.vercel.app

## 9. Masle (troubleshooting)

| Masla | Hal |
| --- | --- |
| `npm install` fail | Node 18+ check karein, `npm config set registry https://registry.npmjs.org/` |
| Port busy | `npm run dev -- --port 5177` |
| Admin blank / purana UI | Browser cache + service worker: DevTools → Application → *Unregister* service worker, hard reload |
| Login "Invalid" | Supabase project paused ho sakta hai — dashboard.supabase.com par check karein |
| Push nahi aa raha | Browser notification permission ON + `/admin/notifications` par device register ho |
