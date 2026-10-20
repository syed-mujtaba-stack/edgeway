import type {
  AdminUser,
  BusinessSettings,
  Inquiry,
  InquiryNote,
  NewInquiry,
  PushDevice,
  SiteImageRow,
} from "@/types/db";

export type RepoEvent =
  | { type: "insert"; inquiry: Inquiry }
  | { type: "update"; inquiry: Inquiry }
  | { type: "delete"; id: string };

export type Unsubscribe = () => void;

/**
 * One interface, two implementations:
 *  - demo     → localStorage + IndexedDB, BroadcastChannel "realtime"
 *  - supabase → Postgres + Storage + Auth + Realtime
 * The whole UI is written against this, so switching backends is an env change.
 */
export interface Repo {
  mode: "demo" | "supabase";

  /* auth ------------------------------------------------------------------ */
  getSession(): Promise<AdminUser | null>;
  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;

  /* inquiries ------------------------------------------------------------- */
  listInquiries(): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | null>;
  createInquiry(input: NewInquiry): Promise<Inquiry>;
  updateInquiry(id: string, patch: { status?: Inquiry["status"]; isRead?: boolean }): Promise<Inquiry>;
  addNote(id: string, body: string): Promise<InquiryNote>;
  deleteInquiry(id: string): Promise<void>;
  /** permanently delete several inquiries in one round trip */
  deleteInquiries(ids: string[]): Promise<void>;
  subscribeInquiries(cb: (event: RepoEvent) => void): Unsubscribe;

  /* images ---------------------------------------------------------------- */
  listImages(): Promise<SiteImageRow[]>;
  uploadImage(slot: string, file: File, alt: string): Promise<SiteImageRow>;
  resetImage(slot: string): Promise<SiteImageRow>;
  restoreVersion(slot: string, versionId: string): Promise<SiteImageRow>;

  /* push ------------------------------------------------------------------ */
  listPushDevices(): Promise<PushDevice[]>;
  savePushSubscription(sub: PushSubscriptionJSON): Promise<PushDevice>;
  removePushDevice(id: string): Promise<void>;

  /* settings -------------------------------------------------------------- */
  getSettings(): Promise<BusinessSettings>;
  saveSettings(settings: BusinessSettings): Promise<void>;

  /* demo-only helpers (no-ops in supabase mode) ---------------------------- */
  simulateInquiry?(): Promise<Inquiry>;
}
