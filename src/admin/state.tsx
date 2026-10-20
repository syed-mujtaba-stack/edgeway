import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser, Inquiry, InquiryStats, NewInquiry } from "@/types/db";
import { repo } from "@/lib/repo";

/* -------------------------------------------------------------------------- */
/* toasts                                                                     */
/* -------------------------------------------------------------------------- */

export type Toast = { id: string; tone: "info" | "ok" | "error"; title: string; body?: string };

type ToastCtx = { toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: string) => void };
const ToastContext = createContext<ToastCtx | null>(null);

/* -------------------------------------------------------------------------- */
/* session + inquiries                                                        */
/* -------------------------------------------------------------------------- */

type AdminCtx = {
  user: AdminUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  inquiries: Inquiry[];
  loading: boolean;
  error: string | null;
  stats: InquiryStats;
  refresh: () => Promise<void>;

  markRead: (id: string, isRead?: boolean) => Promise<void>;
  setStatus: (id: string, status: Inquiry["status"]) => Promise<void>;
  addNote: (id: string, body: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** permanently delete several inquiries at once */
  removeMany: (ids: string[]) => Promise<void>;
  simulate: () => Promise<void>;
  unread: number;
};

const AdminContext = createContext<AdminCtx | null>(null);

function computeStats(inquiries: Inquiry[]): InquiryStats {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const byStatus = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0, spam: 0 };
  for (const i of inquiries) byStatus[i.status] += 1;
  return {
    total: inquiries.length,
    unread: inquiries.filter((i) => !i.isRead && i.status !== "spam").length,
    today: inquiries.filter((i) => new Date(i.createdAt).getTime() >= startOfToday.getTime()).length,
    week: inquiries.filter((i) => new Date(i.createdAt).getTime() >= weekAgo).length,
    byStatus,
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  /* toasts */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-3), { ...toast, id }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  /* session */
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repo()
      .getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  /* inquiries */
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setInquiries(await repo().listInquiries());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);

  /* realtime */
  useEffect(() => {
    if (!user) return;
    const unsubscribe = repo().subscribeInquiries((event) => {
      if (event.type === "insert") {
        setInquiries((list) => [event.inquiry, ...list.filter((i) => i.id !== event.inquiry.id)]);
        push({
          tone: "info",
          title: `New request — ${event.inquiry.name}`,
          body: [event.inquiry.siteType, event.inquiry.location].filter(Boolean).join(" · "),
        });
      } else if (event.type === "update") {
        setInquiries((list) => list.map((i) => (i.id === event.inquiry.id ? event.inquiry : i)));
      } else {
        setInquiries((list) => list.filter((i) => i.id !== event.id));
      }
    });
    return unsubscribe;
  }, [user, push]);

  const stats = useMemo(() => computeStats(inquiries), [inquiries]);

  /* unread count in the tab title so a background tab still tells you */
  useEffect(() => {
    const base = "Edgeway Admin";
    document.title = stats.unread > 0 ? `(${stats.unread}) ${base}` : base;
  }, [stats.unread]);

  const markRead = useCallback(async (id: string, isRead = true) => {
    setInquiries((list) => list.map((i) => (i.id === id ? { ...i, isRead } : i)));
    try {
      await repo().updateInquiry(id, { isRead });
    } catch (e) {
      push({ tone: "error", title: "Could not update", body: e instanceof Error ? e.message : undefined });
    }
  }, [push]);

  const setStatus = useCallback(
    async (id: string, status: Inquiry["status"]) => {
      const previous = inquiries.find((i) => i.id === id);
      setInquiries((list) =>
        list.map((i) => (i.id === id ? { ...i, status, isRead: true } : i)),
      );
      try {
        await repo().updateInquiry(id, { status, isRead: true });
      } catch (e) {
        if (previous) setInquiries((list) => list.map((i) => (i.id === id ? previous : i)));
        push({ tone: "error", title: "Could not change status", body: e instanceof Error ? e.message : undefined });
      }
    },
    [inquiries, push],
  );

  const addNote = useCallback(
    async (id: string, body: string) => {
      if (!body.trim()) return;
      try {
        const note = await repo().addNote(id, body);
        setInquiries((list) =>
          list.map((i) => (i.id === id ? { ...i, notes: [...i.notes, note] } : i)),
        );
      } catch (e) {
        push({ tone: "error", title: "Could not save note", body: e instanceof Error ? e.message : undefined });
      }
    },
    [push],
  );

  const removeMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const gone = new Set(ids);
      const snapshot = inquiries;
      setInquiries((list) => list.filter((i) => !gone.has(i.id)));
      try {
        await repo().deleteInquiries(ids);
        push({
          tone: "ok",
          title: ids.length > 1 ? `${ids.length} inquiries deleted` : "Inquiry deleted",
          body: "Removed permanently — this cannot be undone.",
        });
      } catch (e) {
        setInquiries(snapshot);
        push({ tone: "error", title: "Could not delete", body: e instanceof Error ? e.message : undefined });
      }
    },
    [inquiries, push],
  );

  const remove = useCallback((id: string) => removeMany([id]), [removeMany]);

  const simulate = useCallback(async () => {
    if (!repo().simulateInquiry) return;
    await repo().simulateInquiry!();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await repo().signIn(email, password);
    setUser(next);
  }, []);

  const signOut = useCallback(async () => {
    await repo().signOut();
    setUser(null);
    setInquiries([]);
  }, []);

  const adminValue: AdminCtx = {
    user,
    ready,
    signIn,
    signOut,
    inquiries,
    loading,
    error,
    stats,
    refresh,
    markRead,
    setStatus,
    addNote,
    remove,
    removeMany,
    simulate,
    unread: stats.unread,
  };

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      <AdminContext.Provider value={adminValue}>{children}</AdminContext.Provider>
    </ToastContext.Provider>
  );
}

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

export function useToasts(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used inside <AdminProvider>");
  return ctx;
}

/** Shared helper for the public form too (queued offline submissions). */
export async function submitInquiry(input: NewInquiry): Promise<Inquiry> {
  return repo().createInquiry(input);
}
