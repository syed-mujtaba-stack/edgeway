/**
 * Native (Capacitor) helpers — Android/iOS shell for the admin dashboard only.
 *
 * The Android app bundles the same web build but is restricted to /admin:
 * the public marketing pages are redirected away, the hardware back button is
 * wired to the router, and the status bar / splash screen follow the brand.
 *
 * Everything here is a no-op in a normal browser, so the website is unchanged.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, unknown>;
};

const cap = (): CapacitorGlobal | undefined =>
  (globalThis as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;

/** True inside the packaged Android/iOS app (Capacitor WebView). */
export const isNativeApp = () => Boolean(cap()?.isNativePlatform?.());

/** Public site paths that make no sense inside the admin-only app. */
const PUBLIC_PREFIXES = ["/services", "/industries", "/contact", "/index.html"];

export const isPublicPath = (path: string) => {
  if (path === "/" || path === "") return true;
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

/**
 * Keeps the native app on the dashboard: any public URL is replaced with
 * /admin. Runs before the router mounts, so there is no flash of the site.
 */
export function lockToAdminDashboard(): void {
  if (!isNativeApp()) return;
  const { pathname, search, hash } = window.location;
  if (isPublicPath(pathname)) {
    window.history.replaceState(null, "", `/admin${search}${hash}`);
  }
}

/**
 * Native polish: brand status bar, hide the splash once React has painted and
 * map the Android back button to browser history (exit only from the root).
 */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#f3efe6" });
    if (cap()?.getPlatform?.() === "android") {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    /* plugin not present (web build) */
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    /* optional */
  }

  try {
    const { App: CapacitorApp } = await import("@capacitor/app");
    await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack || window.location.pathname !== "/admin") {
        window.history.back();
      } else {
        void CapacitorApp.exitApp();
      }
    });
  } catch {
    /* optional */
  }

  // Let the first paint land, then drop the splash screen.
  const hideSplash = async () => {
    try {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide();
    } catch {
      /* optional */
    }
  };
  window.requestAnimationFrame(() => window.setTimeout(() => void hideSplash(), 120));
}
