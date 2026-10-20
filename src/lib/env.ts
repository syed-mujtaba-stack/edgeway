/** Environment switches. Everything degrades to a working demo when unset. */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "",
  quoteEndpoint: import.meta.env.VITE_QUOTE_ENDPOINT ?? "",
};

/** True when real Supabase credentials are configured. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/**
 * demo   → everything is stored locally (localStorage + IndexedDB) and realtime
 *          is simulated with BroadcastChannel; perfect for previews and QA.
 * supabase → real Postgres, storage, auth, realtime and push.
 */
export const repoMode: "demo" | "supabase" = isSupabaseConfigured ? "supabase" : "demo";

/**
 * Visible stamp of the build the browser is actually running. Handy when a
 * client reports "the button is empty" — if this string is old, they are
 * looking at a cached stylesheet rather than the current build.
 */
export const BUILD_TAG = "20 Oct 2026 · sw3";
