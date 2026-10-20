/* Edgeway service worker — PWA shell, offline support and web push.
   Kept dependency-free so it is easy to read and audit.
   Bump VERSION whenever CSS/JS behaviour changes: activation deletes every cache
   that does not start with the new version, so nobody keeps an old stylesheet. */

const VERSION = "edgeway-v3";
const SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/assets/img/crest-96.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
const IMG_CACHE = `${VERSION}-img`;
const ASSET_CACHE = `${VERSION}-assets`;
const PAGE_CACHE = `${VERSION}-pages`;
const SHELL_CACHE = `${VERSION}-shell`;

/* -------------------------------------------------------------------------- */
/* install / activate                                                         */
/* -------------------------------------------------------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

/* The page asks the waiting worker to take over as soon as it is ready. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* -------------------------------------------------------------------------- */
/* fetch                                                                      */
/* -------------------------------------------------------------------------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase/API calls

  // Leave the Vite dev server alone — no caching of unbundled modules.
  if (/^\/(src|@|node_modules)\//.test(url.pathname)) return;

  // Navigations: network first, cached page, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match("/offline.html")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Images: cache first, then network (they are content-stable).
  if (request.destination === "image") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(IMG_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Scripts/styles/fonts: network first (so a fix is never hidden behind a stale
  // cache), falling back to the cached copy when the network is unavailable.
  if (["script", "style", "font"].includes(request.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await cache.match(request);
          return cached || Response.error();
        }
      })(),
    );
  }
});

/* -------------------------------------------------------------------------- */
/* web push                                                                   */
/* -------------------------------------------------------------------------- */

self.addEventListener("push", (event) => {
  let payload = {
    title: "New quote request",
    body: "Open the dashboard to see the details.",
    url: "/admin/inquiries",
    tag: undefined,
  };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      tag: payload.tag,
      renotify: Boolean(payload.tag),
      data: { url: payload.url || "/admin/inquiries" },
      vibrate: [90, 40, 90],
      actions: [{ action: "open", title: "Open inbox" }],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/admin/inquiries";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          await client.focus();
          client.postMessage({ type: "navigate", url: target });
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

/* Re-subscribe when the browser rotates the subscription. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clientList.forEach((client) => client.postMessage({ type: "resubscribe-push" }));
    })(),
  );
});

/* Let the page ask the worker to update immediately after a deploy. */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
