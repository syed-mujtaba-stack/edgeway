import type { BusinessSettings, Inquiry, InquiryStatus } from "@/types/db";
import { company } from "@/data/site";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const note = (id: string, body: string, minutes: number) => ({
  id,
  body,
  author: "Demo Admin",
  createdAt: minutesAgo(minutes),
});

type SeedInput = {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  services: string[];
  siteType?: string;
  timing?: string;
  location?: string;
  message?: string;
  status: InquiryStatus;
  isRead: boolean;
  minutes: number;
  notes?: Inquiry["notes"];
};

const seeds: SeedInput[] = [
  {
    id: "seed-1",
    name: "Marcus Reyes",
    company: "Reyes Logistics",
    email: "marcus@reyeslogistics.com",
    phone: "(213) 555-0142",
    services: ["Security Guards", "Vehicle Patrol"],
    siteType: "Warehouse",
    timing: "Today",
    location: "Los Angeles, CA",
    message:
      "We had two break-ins at the loading dock this month. Need overnight guards plus a patrol pass through the yard.",
    status: "new",
    isRead: false,
    minutes: 4,
  },
  {
    id: "seed-2",
    name: "Dana Whitfield",
    company: "Northgate Plaza",
    email: "dana@northgateplaza.com",
    phone: "(714) 555-0198",
    services: ["Cameras"],
    siteType: "Plaza",
    timing: "This week",
    location: "Anaheim, CA",
    message: "Three buildings, shared parking. Looking for camera coverage and 24/7 monitoring.",
    status: "new",
    isRead: false,
    minutes: 38,
  },
  {
    id: "seed-3",
    name: "Priya Raman",
    company: "Sunview Construction",
    email: "priya@sunviewbuild.com",
    phone: "(619) 555-0177",
    services: ["Cameras", "Security Guards"],
    siteType: "Construction Site",
    timing: "This month",
    location: "San Diego, CA",
    message: "No power on site yet — do you have solar cameras? Tools are being taken at night.",
    status: "contacted",
    isRead: true,
    minutes: 320,
    notes: [note("note-1", "Called back at 10:15 — site visit booked for Thursday 9am.", 300)],
  },
  {
    id: "seed-4",
    name: "Ellis Grant",
    company: "Grant Medical Center",
    email: "egrant@grantmedical.org",
    phone: "(747) 555-0133",
    services: ["Security Guards"],
    siteType: "Hospital",
    timing: "This month",
    location: "Glendale, CA",
    message: "Emergency department coverage, nights and weekends.",
    status: "quoted",
    isRead: true,
    minutes: 1_500,
    notes: [note("note-2", "Sent quote for 2 posts × 12h, 7 nights. Following up Monday.", 1_200)],
  },
  {
    id: "seed-5",
    name: "Tomas Alvarez",
    company: "Alvarez Shopping Center",
    email: "tomas@alvarezsc.com",
    phone: "(562) 555-0110",
    services: ["Vehicle Patrol", "Cameras", "Not sure yet"],
    siteType: "Shopping Center",
    timing: "Just planning",
    location: "Long Beach, CA",
    message: "Budget cycle starts next quarter. Want options for lot patrol and cameras.",
    status: "won",
    isRead: true,
    minutes: 4_320,
  },
  {
    id: "seed-6",
    name: "asdf",
    email: "asdf@asdf.asdf",
    phone: "0000000000",
    services: ["Not sure yet"],
    message: "cheap seo services click here",
    status: "spam",
    isRead: true,
    minutes: 5_000,
  },
];

export function seedInquiries(): Inquiry[] {
  return seeds.map((s) => ({
    id: s.id,
    name: s.name,
    company: s.company ?? null,
    email: s.email,
    phone: s.phone,
    services: s.services,
    siteType: s.siteType ?? null,
    timing: s.timing ?? null,
    location: s.location ?? null,
    message: s.message ?? null,
    status: s.status,
    isRead: s.isRead,
    source: "website",
    createdAt: minutesAgo(s.minutes),
    updatedAt: minutesAgo(s.minutes),
    notes: s.notes ?? [],
  }));
}

export const defaultSettings: BusinessSettings = {
  phoneDisplay: company.phoneDisplay,
  phoneHref: company.phoneHref,
  email: company.email,
  addressLine1: company.address.line1,
  addressLine2: company.address.line2,
  ppo: company.ppo,
  notifyEmail: company.email,
};

/** Names used by the "simulate incoming lead" button in demo mode. */
export const simulatorLeads = [
  {
    name: "Nina Okafor",
    company: "Okafor Retail Group",
    email: "nina@okaforretail.com",
    phone: "(310) 555-0121",
    services: ["Security Guards"],
    siteType: "Store",
    timing: "Today",
    location: "Inglewood, CA",
    message: "Need a guard at the front door starting tonight, 6pm–2am.",
  },
  {
    name: "Ben Whitaker",
    company: "Harbor Point Marina",
    email: "ben@harborpoint.com",
    phone: "(562) 555-0188",
    services: ["Vehicle Patrol", "Cameras"],
    siteType: "Other",
    timing: "This week",
    location: "San Pedro, CA",
    message: "Boat slips and parking lot. Vandalism after hours — want patrol plus solar cameras.",
  },
  {
    name: "Sofia Marchetti",
    company: "Marchetti Warehousing",
    email: "sofia@marchettiwh.com",
    phone: "(909) 555-0155",
    services: ["Cameras"],
    siteType: "Warehouse",
    timing: "This month",
    location: "Ontario, CA",
    message: "Six dock doors, one gate. Need cameras plus monitoring.",
  },
] as const;
