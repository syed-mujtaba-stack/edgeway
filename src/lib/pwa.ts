/** Service worker registration + install prompt plumbing. */

let installEvent: (Event & { prompt: () => Promise<void> }) | null = null;

const RELOAD_KEY = "edgeway.sw.reloaded";

export function registerServiceWorker(onMessage?: (data: unknown) => void) {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // A new worker takes over immediately. If this tab is still running the
        // previous version, reload once so the fresh CSS/JS is actually used.
        const takeOver = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.postMessage({ type: "SKIP_WAITING" });
          if (!navigator.serviceWorker.controller) return; // first install
          if (sessionStorage.getItem(RELOAD_KEY)) return;
          sessionStorage.setItem(RELOAD_KEY, "1");
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") window.location.reload();
          });
        };

        if (registration.waiting) takeOver(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent("edgeway:update-available"));
              takeOver(worker);
            }
          });
        });

        // Check for a newer worker on every load (cheap, no-cache request).
        void registration.update().catch(() => undefined);
      })
      .catch(() => {
        /* registration failures must never break the site */
      });
  });

  navigator.serviceWorker.addEventListener("message", (event) => onMessage?.(event.data));
}

/** Swap the manifest so an installed admin app opens straight into /admin. */
export function useAdminManifest(enabled: boolean) {
  if (typeof document === "undefined") return;
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) return;
  link.href = enabled ? "/admin-manifest.webmanifest" : "/manifest.webmanifest";
}

export function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event as Event & { prompt: () => Promise<void> };
    window.dispatchEvent(new CustomEvent("edgeway:install-available"));
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    window.dispatchEvent(new CustomEvent("edgeway:installed"));
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!installEvent) return false;
  await installEvent.prompt();
  installEvent = null;
  return true;
}

export const canInstall = () => Boolean(installEvent);

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari exposes it on navigator instead
  (navigator as unknown as { standalone?: boolean }).standalone === true;
