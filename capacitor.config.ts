import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Edgeway Admin — native Android shell (Capacitor).
 *
 * Only the admin dashboard ships inside the app: the web build is bundled in
 * `dist` and the native runtime redirects any public route to `/admin`
 * (see `src/lib/native.ts`). The public marketing site stays web-only.
 */
const config: CapacitorConfig = {
  appId: "com.edgewaysecurity.admin",
  appName: "Edgeway Admin",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // keep the dashboard on a secure origin so the service worker, storage and
    // Supabase (https/wss) calls all behave exactly like they do on the web
    allowMixedContent: false,
    backgroundColor: "#f3efe6",
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: "https",
    hostname: "admin.edgewaysecurity.app",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#f3efe6",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f3efe6",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
