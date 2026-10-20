/**
 * Domain types shared by the public site and the admin dashboard.
 * In Supabase mode these mirror the SQL schema in supabase/migrations.
 */

export type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "lost" | "spam";

export const inquiryStatuses: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "spam", label: "Spam" },
];

export type InquiryNote = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
};

export type Inquiry = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  services: string[];
  siteType: string | null;
  timing: string | null;
  location: string | null;
  message: string | null;
  status: InquiryStatus;
  isRead: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
  notes: InquiryNote[];
};

/** Payload the public contact form sends. */
export type NewInquiry = {
  name: string;
  company: string;
  email: string;
  phone: string;
  services: string[];
  siteType: string;
  timing: string;
  location: string;
  message: string;
  submissionId: string;
};

export type ImageVersion = {
  id: string;
  url: string;
  alt: string;
  createdAt: string;
  createdBy: string;
};

/** One editable image slot on the site. */
export type SiteImageRow = {
  slot: string;
  /** stored full-size (2400w) image; null = bundled default is used */
  src2400: string | null;
  /** 1200w derivative */
  src1200: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  history: ImageVersion[];
};

export type PushDevice = {
  id: string;
  device: string;
  endpoint: string;
  createdAt: string;
  lastOkAt: string | null;
  current?: boolean;
};

export type BusinessSettings = {
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  ppo: string;
  notifyEmail: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "viewer";
};

export type InquiryStats = {
  total: number;
  unread: number;
  today: number;
  week: number;
  byStatus: Record<InquiryStatus, number>;
};
