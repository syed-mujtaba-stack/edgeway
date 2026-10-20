import { createDemoRepo } from "@/lib/repo/demo";
import type { Repo, RepoEvent, Unsubscribe } from "@/lib/repo/types";
import { repoMode } from "@/lib/env";

/**
 * The single backend entry point the UI talks to.
 *
 * Demo mode needs no configuration. Supabase mode is loaded lazily and wrapped
 * in a thin proxy, so @supabase/supabase-js never ends up in the public site's
 * bundle — visitors only download it if they open /admin.
 */
let instance: Repo | null = null;

const ASYNC_METHODS = [
  "getSession",
  "signIn",
  "signOut",
  "listInquiries",
  "getInquiry",
  "createInquiry",
  "updateInquiry",
  "addNote",
  "deleteInquiry",
  "deleteInquiries",
  "listImages",
  "uploadImage",
  "resetImage",
  "restoreVersion",
  "listPushDevices",
  "savePushSubscription",
  "removePushDevice",
  "getSettings",
  "saveSettings",
  "simulateInquiry",
] as const;

function lazySupabaseRepo(): Repo {
  const load = import("@/lib/repo/supabase").then((module) => module.createSupabaseRepo());
  const ready = load.then((repo) => repo);

  const proxy = { mode: "supabase" } as unknown as Repo;

  for (const key of ASYNC_METHODS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proxy as any)[key] = (...args: unknown[]) =>
      ready.then((repo) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (repo as any)[key];
        return typeof fn === "function" ? fn.apply(repo, args) : undefined;
      });
  }

  proxy.subscribeInquiries = (cb: (event: RepoEvent) => void): Unsubscribe => {
    let unsubscribe: Unsubscribe | null = null;
    let active = true;
    void ready.then((repo) => {
      if (active) unsubscribe = repo.subscribeInquiries(cb);
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  };

  return proxy;
}

export function repo(): Repo {
  if (!instance) {
    instance = repoMode === "supabase" ? lazySupabaseRepo() : createDemoRepo();
  }
  return instance;
}

export function isDemo(): boolean {
  return repoMode === "demo";
}

export type { Repo } from "@/lib/repo/types";
