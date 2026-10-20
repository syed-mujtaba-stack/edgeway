import type { Inquiry, NewInquiry } from "@/types/db";
import { repo } from "@/lib/repo";
import { idb } from "@/lib/idb";

/**
 * Public form submissions.
 *  - online  → written straight to the backend
 *  - offline → queued in IndexedDB and flushed automatically when the connection
 *              returns (background-sync style), so a lead is never lost
 */
export async function submitInquiry(input: NewInquiry): Promise<Inquiry> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await idb.put("queue", input.submissionId, input);
    throw new OfflineQueuedError();
  }
  return repo().createInquiry(input);
}

export class OfflineQueuedError extends Error {
  constructor() {
    super("offline-queued");
    this.name = "OfflineQueuedError";
  }
}

export async function queueInquiry(input: NewInquiry) {
  await idb.put("queue", input.submissionId, input);
}

export async function queuedCount(): Promise<number> {
  try {
    return (await idb.keys("queue")).length;
  } catch {
    return 0;
  }
}

/** Send everything that was captured while offline. Safe to call repeatedly. */
export async function flushQueue(): Promise<number> {
  let sent = 0;
  try {
    const keys = await idb.keys("queue");
    for (const key of keys) {
      const item = await idb.get<NewInquiry>("queue", String(key));
      if (!item) continue;
      try {
        await repo().createInquiry(item);
        await idb.delete("queue", String(key));
        sent += 1;
      } catch {
        break; // still offline or backend down — keep the rest for next time
      }
    }
  } catch {
    /* IndexedDB unavailable — nothing to flush */
  }
  return sent;
}

/** Subscriptions for connectivity changes; returns an unsubscribe function. */
export function watchConnectivity(onFlushed: (sent: number) => void): () => void {
  const handler = () => {
    void flushQueue().then((sent) => {
      if (sent > 0) onFlushed(sent);
    });
  };
  window.addEventListener("online", handler);
  void handler();
  return () => window.removeEventListener("online", handler);
}
