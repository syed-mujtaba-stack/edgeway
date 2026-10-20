/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional POST endpoint for the quote form (Formspree, own API…). */
  readonly VITE_QUOTE_ENDPOINT?: string;
  /** Supabase project URL — set together with the anon key to go live. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable/anon key (safe in the browser; RLS protects the data). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** VAPID public key for real web push (private key lives in the Edge Function). */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
