/**
 * Tiny promise wrapper around IndexedDB — used to keep uploaded demo images and
 * queued offline inquiries out of localStorage (no 5 MB cap, no base64 bloat).
 */
const DB_NAME = "edgeway";
const DB_VERSION = 1;
const STORES = ["images", "queue"] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
  return dbPromise;
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export const idb = {
  get<T>(store: StoreName, key: string) {
    return tx<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  put<T>(store: StoreName, key: string, value: T) {
    return tx<IDBValidKey>(store, "readwrite", (s) => s.put(value, key));
  },
  delete(store: StoreName, key: string) {
    return tx<undefined>(store, "readwrite", (s) => s.delete(key) as IDBRequest<undefined>);
  },
  all<T>(store: StoreName) {
    return tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
  },
  keys(store: StoreName) {
    return tx<IDBValidKey[]>(store, "readonly", (s) => s.getAllKeys());
  },
};
