/**
 * Demo repository — a complete, local implementation of the backend contract.
 *
 * Used whenever VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, so the
 * dashboard, realtime updates, image uploads, offline queue and notifications
 * can all be demoed without any account. Data lives in localStorage (records)
 * and IndexedDB (image blobs); "realtime" is a BroadcastChannel, which even
 * makes two browser tabs talk to each other like the real thing.
 */
import type {
  AdminUser,
  BusinessSettings,
  ImageVersion,
  Inquiry,
  InquiryNote,
  NewInquiry,
  PushDevice,
  SiteImageRow,
} from "@/types/db";
import { imageSlots } from "@/data/imageSlots";
import { idb } from "@/lib/idb";
import { showInquiryNotification, showTestNotification } from "@/lib/notify";
import { defaultSettings, seedInquiries, simulatorLeads } from "@/lib/repo/seed";
import type { Repo, RepoEvent, Unsubscribe } from "@/lib/repo/types";

const KEY = "edgeway.demo.v1";
const CHANNEL = "edgeway.realtime";

type ImageMeta = {
  slot: string;
  alt: string;
  version: number;
  width: number | null;
  height: number | null;
  updatedAt: string;
  updatedBy: string | null;
  history: (ImageVersion & { hasBlobs?: boolean })[];
  /** false when the slot is reset to the bundled default */
  custom: boolean;
  versionKey: string;
};

type DemoState = {
  version: 1;
  seeded: boolean;
  inquiries: Inquiry[];
  images: Record<string, ImageMeta>;
  settings: BusinessSettings;
  session: AdminUser | null;
  password: string | null;
  devices: PushDevice[];
};

const DEMO_USER: AdminUser = {
  id: "demo-admin",
  email: "admin@edgewaysecurity.com",
  name: "Demo Admin",
  role: "owner",
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

/* -------------------------------------------------------------------------- */
/* state                                                                      */
/* -------------------------------------------------------------------------- */

function blankState(): DemoState {
  return {
    version: 1,
    seeded: false,
    inquiries: [],
    images: {},
    settings: { ...defaultSettings },
    session: null,
    password: null,
    devices: [],
  };
}

function read(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw) as DemoState;
    return { ...blankState(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
  } catch {
    return blankState();
  }
}

function write(state: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode — the UI keeps working in memory this session */
  }
}

function ensureSeeded(): DemoState {
  const state = read();
  if (state.seeded) return state;
  const fresh: DemoState = {
    ...state,
    seeded: true,
    inquiries: seedInquiries(),
    images: Object.fromEntries(
      imageSlots.map((slot) => [
        slot.key,
        {
          slot: slot.key,
          alt: slot.defaultAlt,
          version: 0,
          width: null,
          height: null,
          updatedAt: new Date(0).toISOString(),
          updatedBy: null,
          history: [],
          custom: false,
          versionKey: "default",
        } satisfies ImageMeta,
      ]),
    ),
  };
  write(fresh);
  return fresh;
}

/* -------------------------------------------------------------------------- */
/* realtime                                                                   */
/* -------------------------------------------------------------------------- */

const subscribers = new Set<(event: RepoEvent) => void>();
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (msg: MessageEvent<RepoEvent>) => {
      // deliver to this tab's listeners (the sending tab already updated itself)
      subscribers.forEach((cb) => cb(msg.data));
    };
  }
  return channel;
}

function emit(event: RepoEvent, broadcast = true) {
  subscribers.forEach((cb) => cb(event));
  if (broadcast) getChannel()?.postMessage(event);
}

/* -------------------------------------------------------------------------- */
/* image blobs                                                                */
/* -------------------------------------------------------------------------- */

const urlCache = new Map<string, { full: string; small: string }>();

async function blobUrl(key: string): Promise<string | null> {
  const entry = await idb.get<{ full: Blob; small: Blob }>("images", key);
  if (!entry) return null;
  const cached = urlCache.get(key);
  if (cached) return cached.full;
  const urls = { full: URL.createObjectURL(entry.full), small: URL.createObjectURL(entry.small) };
  urlCache.set(key, urls);
  return urls.full;
}

async function smallUrl(key: string): Promise<string | null> {
  const entry = await idb.get<{ full: Blob; small: Blob }>("images", key);
  if (!entry) return null;
  const cached = urlCache.get(key);
  if (cached) return cached.small;
  const urls = { full: URL.createObjectURL(entry.full), small: URL.createObjectURL(entry.small) };
  urlCache.set(key, urls);
  return urls.small;
}

async function toRow(meta: ImageMeta | undefined, slot: string): Promise<SiteImageRow> {
  const fallback = imageSlots.find((s) => s.key === slot);
  if (!meta || !meta.custom) {
    return {
      slot,
      src1200: null,
      src2400: null,
      width: null,
      height: null,
      alt: meta?.alt ?? fallback?.defaultAlt ?? "",
      version: meta?.version ?? 0,
      updatedAt: meta?.updatedAt ?? new Date(0).toISOString(),
      updatedBy: meta?.updatedBy ?? null,
      history: meta?.history ?? [],
    };
  }
  return {
    slot,
    src1200: await smallUrl(meta.versionKey),
    src2400: await blobUrl(meta.versionKey),
    width: meta.width,
    height: meta.height,
    alt: meta.alt,
    version: meta.version,
    updatedAt: meta.updatedAt,
    updatedBy: meta.updatedBy,
    history: meta.history,
  };
}

/* -------------------------------------------------------------------------- */
/* repository                                                                 */
/* -------------------------------------------------------------------------- */

export function createDemoRepo(): Repo {
  const state = () => ensureSeeded();

  const patchInquiry = (id: string, fn: (i: Inquiry) => Inquiry): Inquiry => {
    const s = state();
    const index = s.inquiries.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inquiry not found");
    const next = { ...fn(s.inquiries[index]), updatedAt: new Date().toISOString() };
    s.inquiries[index] = next;
    write(s);
    emit({ type: "update", inquiry: next });
    return next;
  };

  return {
    mode: "demo",

    /* auth ---------------------------------------------------------------- */
    async getSession() {
      return state().session;
    },
    async signIn(email, password) {
      if (!email.trim() || password.trim().length < 4) {
        throw new Error("Enter your email and a password of at least 4 characters.");
      }
      const savedPassword = state().password;
      if (savedPassword && password !== savedPassword) throw new Error("Invalid email or password.");
      const session = { ...DEMO_USER, email: email.trim() };
      const s = state();
      s.session = session;
      write(s);
      return session;
    },
    async resetPassword(email) {
      if (!email.trim()) throw new Error("Enter your email address.");
    },
    async updatePassword(password) {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      const s = state();
      s.password = password;
      write(s);
    },
    async signOut() {
      const s = state();
      s.session = null;
      write(s);
    },

    /* inquiries ----------------------------------------------------------- */
    async listInquiries() {
      return [...state().inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getInquiry(id) {
      return state().inquiries.find((i) => i.id === id) ?? null;
    },
    async createInquiry(input: NewInquiry) {
      const s = state();
      const now = new Date().toISOString();
      const inquiry: Inquiry = {
        id: uid(),
        name: input.name.trim(),
        company: input.company.trim() || null,
        email: input.email.trim(),
        phone: input.phone.trim(),
        services: input.services,
        siteType: input.siteType || null,
        timing: input.timing || null,
        location: input.location.trim() || null,
        message: input.message.trim() || null,
        status: "new",
        isRead: false,
        source: "website",
        createdAt: now,
        updatedAt: now,
        notes: [],
      };
      s.inquiries.unshift(inquiry);
      write(s);
      emit({ type: "insert", inquiry });
      void showInquiryNotification(inquiry);
      return inquiry;
    },
    async updateInquiry(id, patch) {
      return patchInquiry(id, (i) => ({
        ...i,
        status: patch.status ?? i.status,
        isRead: patch.isRead ?? i.isRead,
      }));
    },
    async addNote(id, body) {
      const note: InquiryNote = {
        id: uid(),
        body: body.trim(),
        author: DEMO_USER.name,
        createdAt: new Date().toISOString(),
      };
      patchInquiry(id, (i) => ({ ...i, notes: [...i.notes, note] }));
      return note;
    },
    async deleteInquiry(id) {
      const s = state();
      s.inquiries = s.inquiries.filter((i) => i.id !== id);
      write(s);
      emit({ type: "delete", id });
    },

    async deleteInquiries(ids) {
      const gone = new Set(ids);
      const s = state();
      s.inquiries = s.inquiries.filter((i) => !gone.has(i.id));
      write(s);
      for (const id of gone) emit({ type: "delete", id });
    },
    subscribeInquiries(cb: (event: RepoEvent) => void): Unsubscribe {
      subscribers.add(cb);
      getChannel();
      return () => subscribers.delete(cb);
    },

    /* images -------------------------------------------------------------- */
    async listImages() {
      const s = state();
      return Promise.all(imageSlots.map((slot) => toRow(s.images[slot.key], slot.key)));
    },

    async uploadImage(slot, file, alt) {
      const { processImage } = await import("@/lib/imagePipeline");
      const processed = await processImage(file);
      const s = state();
      const previous = s.images[slot];
      const version = (previous?.version ?? 0) + 1;
      const versionKey = `img:${slot}:v${version}`;

      await idb.put("images", versionKey, { full: processed.full, small: processed.small });

      const historyEntry: ImageVersion = {
        id: uid(),
        url: versionKey,
        alt,
        createdAt: new Date().toISOString(),
        createdBy: DEMO_USER.name,
      };

      const meta: ImageMeta = {
        slot,
        alt,
        version,
        width: processed.width,
        height: processed.height,
        updatedAt: new Date().toISOString(),
        updatedBy: DEMO_USER.name,
        custom: true,
        versionKey,
        history: [historyEntry, ...(previous?.history ?? [])].slice(0, 8),
      };
      s.images[slot] = meta;
      write(s);
      return toRow(meta, slot);
    },

    async resetImage(slot) {
      const s = state();
      const previous = s.images[slot];
      const meta: ImageMeta = {
        slot,
        alt: imageSlots.find((i) => i.key === slot)?.defaultAlt ?? "",
        version: previous?.version ?? 0,
        width: null,
        height: null,
        updatedAt: new Date().toISOString(),
        updatedBy: DEMO_USER.name,
        custom: false,
        versionKey: "default",
        history: previous?.history ?? [],
      };
      s.images[slot] = meta;
      write(s);
      return toRow(meta, slot);
    },

    async restoreVersion(slot, versionId) {
      const s = state();
      const previous = s.images[slot];
      const target = previous?.history.find((h) => h.id === versionId);
      if (!previous || !target) throw new Error("That version is no longer available");
      const version = previous.version + 1;
      const versionKey = target.url;
      const source = await idb.get<{ full: Blob; small: Blob }>("images", versionKey);
      if (!source) throw new Error("That version is no longer available");
      await idb.put("images", `img:${slot}:v${version}`, source);

      const meta: ImageMeta = {
        ...previous,
        version,
        versionKey: `img:${slot}:v${version}`,
        custom: true,
        alt: target.alt,
        updatedAt: new Date().toISOString(),
        updatedBy: DEMO_USER.name,
        history: [
          {
            id: uid(),
            url: `img:${slot}:v${version}`,
            alt: target.alt,
            createdAt: new Date().toISOString(),
            createdBy: DEMO_USER.name,
          },
          ...previous.history,
        ].slice(0, 8),
      };
      s.images[slot] = meta;
      write(s);
      return toRow(meta, slot);
    },

    /* push ---------------------------------------------------------------- */
    async listPushDevices() {
      return state().devices;
    },
    async savePushSubscription(sub) {
      const s = state();
      const endpoint = sub.endpoint ?? "";
      const existing = s.devices.find((d) => d.endpoint === endpoint);
      if (existing) return existing;
      const device: PushDevice = {
        id: uid(),
        device: `${navigator.platform || "Device"} · ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}`,
        endpoint: endpoint.slice(0, 80),
        createdAt: new Date().toISOString(),
        lastOkAt: new Date().toISOString(),
        current: true,
      };
      s.devices = [device, ...s.devices];
      write(s);
      return device;
    },
    async removePushDevice(id) {
      const s = state();
      s.devices = s.devices.filter((d) => d.id !== id);
      write(s);
    },

    /* settings ------------------------------------------------------------ */
    async getSettings() {
      return state().settings;
    },
    async saveSettings(next) {
      const s = state();
      s.settings = next;
      write(s);
    },

    /* demo helpers -------------------------------------------------------- */
    async simulateInquiry() {
      const lead = simulatorLeads[Math.floor(Math.random() * simulatorLeads.length)];
      return this.createInquiry({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        services: [...lead.services],
        siteType: lead.siteType,
        timing: lead.timing,
        location: lead.location,
        message: lead.message,
        submissionId: uid(),
      });
    },
  };
}

/** Demo-mode browser notification (works while the admin tab is installed/open). */
export const demoNotifications = { showTestNotification, showInquiryNotification };
