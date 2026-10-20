/**
 * Single source of truth for every piece of copy, contact detail and image used
 * across the site. Keeping it here means the JSX stays about layout, and the
 * client's real details (phone, PPO number, address…) can be changed in one file.
 *
 * All copy is identical to the approved static design.
 */

import type { ReactNode } from "react";

export const company = {
  name: "Edgeway Security Inc.",
  shortName: "Edgeway",
  ppo: "PPO #122631",
  phoneDisplay: "(747) 370-4640",
  phoneHref: "tel:+17473704640",
  email: "info@edgewaysecurity.com",
  emailHref: "mailto:info@edgewaysecurity.com",
  serviceArea: "Serving all of California",
  /** TODO: replace with the real street address */
  address: {
    line1: "[Street Address]",
    line2: "[City], CA [ZIP]",
  },
  tagline: ["Guards, cameras and vehicle patrol", "We got you covered."],
} as const;

export type NavItem = {
  label: string;
  to: string;
  /** used for aria-current on both desktop and mobile nav */
  match: (pathname: string) => boolean;
  current?: boolean;
};

export const primaryNav: NavItem[] = [
  { label: "Services", to: "/services", match: (p) => p.startsWith("/services") },
  { label: "Industries", to: "/industries", match: (p) => p.startsWith("/industries") },
  { label: "FAQ", to: "/contact#faq", match: () => false },
  { label: "Contact", to: "/contact", match: (p) => p.startsWith("/contact") && !p.includes("faq") },
];

export const mobileNav: NavItem[] = [
  { label: "Home", to: "/", match: (p) => p === "/" },
  ...primaryNav,
];

/* --------------------------------------------------------------------------
   Images — every asset ships at 1200w and 2400w so the browser can pick
   -------------------------------------------------------------------------- */

export type ImageSpec = {
  /** file stem in /public/assets/img, e.g. "guard-line" */
  name: string;
  widths: readonly number[];
  width: number;
  height: number;
  alt: string;
  /** admin-editable slot key (see data/imageSlots.ts) — optional */
  slot?: string;
};

const img = (
  name: string,
  width: number,
  height: number,
  alt: string,
  widths: readonly number[] = [1200, 2400],
  slot?: string,
): ImageSpec => ({ name, widths, width, height, alt, slot });

/**
 * URL of the bundled original for an ImageSpec.
 * Single-size marks (the crest, the apple-touch icon) ship as PNG and carry no
 * width suffix; photos ship as `<name>-<width>.webp`.
 */
export const bundledImageSrc = (image: ImageSpec) =>
  image.widths.length === 1
    ? `/assets/img/${image.name}.png`
    : `/assets/img/${image.name}-${image.widths[0]}.webp`;

export const images = {
  hero: img("guard-line", 2400, 879, "Four security officers in black Security jackets standing side by side", [1200, 2400], "hero"),
  guardJacket: img("guard-jacket", 1200, 672, "Close-up of a security officer’s jacket with a gold Security patch", [1200, 2400], "service_guards"),
  cameraInstall: img("camera-install", 1200, 800, "Technician mounting an outdoor security camera on a wall", [1200, 2400], "service_cameras"),
  patrolLightbar: img("patrol-lightbar", 1200, 800, "Roof of a white patrol vehicle with an amber light bar", [1200, 2400], "service_patrol"),
  dispatch: img("dispatch", 1200, 671, "Dispatcher watching a wall of live security camera feeds", [1200, 2400], "dispatch"),
  controlRoom: img("control-room", 1200, 800, "Security control room with rows of monitors showing camera feeds", [1200, 2400], "control_room"),
  nightPatrol: img("night-patrol", 1200, 800, "Security officer walking along a lit perimeter fence at night", [1200, 2400], "night_patrol"),
  crest: img("crest-96", 82, 96, "", [96], "crest"),
  appleTouch: img("apple-touch-icon", 180, 180, "", [180]),
} as const;

/* --------------------------------------------------------------------------
   Home — "at a glance" assurances
   -------------------------------------------------------------------------- */

export type AssurePoint = { title: string; note: string };

export const assurePoints: AssurePoint[] = [
  { title: "Licensed & insured", note: "Fully covered, every site." },
  { title: "Same-day guards", note: "When you need someone today." },
  { title: "24/7 dispatch", note: "Cameras and vehicles, always watched." },
  { title: "All of California", note: "We got it covered." },
];

/* --------------------------------------------------------------------------
   Services (shared by the home tabs and the Services page)
   -------------------------------------------------------------------------- */

export type Offering = { num: string; title: string; body: string };

export type Service = {
  key: "guards" | "cameras" | "patrol";
  /** short label used on the tabs */
  tab: string;
  /** label used in the quote form chips */
  chip: string;
  /** home tab panel */
  home: {
    title: string;
    lede: string;
    offerings: Offering[];
    ctaLabel: string;
  };
  /** services page feature */
  page: {
    eyebrow: string;
    title: string;
    lede: string;
    offerings: Offering[];
    note?: string;
    image: ImageSpec;
    /** only guards has a direct quote CTA */
    quoteLabel?: string;
    quoteHref?: string;
  };
  image: ImageSpec;
};

export const services: Service[] = [
  {
    key: "guards",
    tab: "Security Guards",
    chip: "Security Guards",
    image: images.guardJacket,
    home: {
      title: "A Trained Presence, On Site.",
      lede: "Uniformed officers who know your site, your people and your routine, from front-desk coverage to high-risk posts.",
      offerings: [
        { num: "01", title: "Unarmed Guards", body: "Access control, foot patrols and a visible deterrent." },
        { num: "02", title: "Armed Guards", body: "For higher-risk sites and assets that call for it." },
        { num: "03", title: "Off-Duty Police Officers", body: "Law-enforcement experience, working your site." },
      ],
      ctaLabel: "Guard Services",
    },
    page: {
      eyebrow: "01 · Security Guards",
      title: "A Trained Presence, On Site.",
      lede: "Nothing deters trouble like a professional who’s actually there. Our officers learn your site, your people and your routine, and they carry themselves accordingly.",
      offerings: [
        {
          num: "01",
          title: "Unarmed Guards",
          body: "Access control, front-desk coverage, foot patrols and a calm, visible deterrent for everyday sites.",
        },
        {
          num: "02",
          title: "Armed Guards",
          body: "For higher-risk sites, valuable assets and situations that call for an armed, professional presence.",
        },
        {
          num: "03",
          title: "Off-Duty Police Officers",
          body: "Law-enforcement experience working your site, for when you need that extra level of authority.",
        },
      ],
      image: images.guardJacket,
      quoteLabel: "Request Guards",
      quoteHref: "/contact?service=guards#quote",
    },
  },
  {
    key: "cameras",
    tab: "Cameras",
    chip: "Cameras",
    image: images.cameraInstall,
    home: {
      title: "Eyes on Every Corner, Day and Night.",
      lede: "Installed or solar-powered, every camera we put up can be watched live by our dispatch team.",
      offerings: [
        { num: "01", title: "Camera Installation", body: "Placed where they matter and installed cleanly." },
        { num: "02", title: "Solar Cameras", body: "For lots and sites without reliable power." },
        { num: "03", title: "24/7 Camera Monitoring", body: "Available for both installed and solar systems." },
      ],
      ctaLabel: "Camera Services",
    },
    page: {
      eyebrow: "02 · Cameras",
      title: "Eyes on Every Corner, Day and Night.",
      lede: "We survey your site, place cameras where they actually matter, and connect them to a dispatch team that’s watching around the clock.",
      offerings: [
        {
          num: "01",
          title: "Camera Installation",
          body: "Planned coverage of entrances, lots and blind spots, installed cleanly and tested on site.",
        },
        {
          num: "02",
          title: "Solar Cameras",
          body: "Self-powered units for construction sites, remote yards and lots without reliable power.",
        },
        {
          num: "03",
          title: "24/7 Camera Monitoring",
          body: "Available for both installed and solar cameras. Dispatch watches live and acts when something’s wrong.",
        },
      ],
      note: "All cameras will be monitored 24/7 by dispatch",
      image: images.cameraInstall,
    },
  },
  {
    key: "patrol",
    tab: "Vehicle Patrol",
    chip: "Vehicle Patrol",
    image: images.patrolLightbar,
    home: {
      title: "Moving Coverage, Wherever You Need It.",
      lede: "Marked vehicles in constant contact with dispatch, from a single lot to a route between cities.",
      offerings: [
        { num: "01", title: "Lot Patrolling", body: "Regular, unpredictable passes through lots and yards." },
        {
          num: "02",
          title: "Lot Escorting",
          body: "Vehicles escorted in and out of secure lots, kept clear of restricted areas.",
        },
        { num: "03", title: "Escorting Between Cities", body: "For shipments, equipment and people on the move." },
      ],
      ctaLabel: "Patrol Services",
    },
    page: {
      eyebrow: "03 · Vehicle Patrol",
      title: "Moving Coverage, Wherever You Need It.",
      lede: "Marked patrol vehicles cover ground that a fixed post can’t, and every unit stays in contact with dispatch from start to finish.",
      offerings: [
        {
          num: "01",
          title: "Lot Patrolling",
          body: "Regular, unpredictable passes through parking lots, yards and perimeters, day or night.",
        },
        {
          num: "02",
          title: "Lot Escorting",
          body: "We escort trucks and other vehicles in and out of secure parking lots, so drivers and other personnel never enter restricted areas.",
        },
        {
          num: "03",
          title: "Escorting Between Cities",
          body: "Escort for shipments, equipment and people traveling between cities.",
        },
      ],
      note: "All vehicles are monitored 24/7 by dispatch",
      image: images.patrolLightbar,
    },
  },
];

export const serviceByKey = (key: string | null | undefined) => services.find((s) => s.key === key);

/* --------------------------------------------------------------------------
   Industries
   -------------------------------------------------------------------------- */

export type SectorItem = { num: string; title: string; body: string; tags: readonly string[] };

export type Sector = {
  id: string;
  jumpLabel: string;
  eyebrow: string;
  title: string;
  lede: string;
  image?: ImageSpec;
  items: SectorItem[];
};

export const sectors: Sector[] = [
  {
    id: "commercial",
    jumpLabel: "Commercial",
    eyebrow: "01 · Commercial",
    title: "Busy by Day. Exposed After Hours.",
    lede: "Open to the public, full of people and inventory, and empty at night. Commercial sites need a presence customers trust and thieves avoid.",
    items: [
      {
        num: "01",
        title: "Stores",
        body: "A professional at the door deters theft and keeps staff and customers at ease.",
        tags: ["Unarmed guards", "Armed guards", "Off-duty police officers", "Cameras"],
      },
      {
        num: "02",
        title: "Shopping Centers",
        body: "Coverage across storefronts, walkways and parking lots, day and night.",
        tags: ["Guards", "Lot patrol", "Cameras"],
      },
      {
        num: "03",
        title: "Plazas",
        body: "Consistent patrols and monitored cameras for multi-tenant properties.",
        tags: ["Lot patrol", "24/7 monitoring"],
      },
    ],
  },
  {
    id: "industrial",
    jumpLabel: "Industrial",
    eyebrow: "02 · Industrial",
    title: "Wide Perimeters. Long Nights.",
    lede: "Valuable equipment, open yards and remote locations. Industrial sites need coverage that works where power and people are scarce.",
    image: images.cameraInstall,
    items: [
      {
        num: "04",
        title: "Construction Sites",
        body: "Solar cameras where there’s no power yet, plus patrols to protect tools and materials.",
        tags: ["Solar cameras", "Lot patrol", "Guards"],
      },
      {
        num: "05",
        title: "Warehouses",
        body: "Access control at the gate, trucks escorted through the yard, and monitored cameras across the docks.",
        tags: ["Guards", "Lot escorting", "Cameras", "Escorts between cities"],
      },
      {
        num: "06",
        title: "Dams",
        body: "Perimeter coverage and patrols for remote, critical infrastructure.",
        tags: ["Armed guards", "Solar cameras", "Patrol"],
      },
    ],
  },
  {
    id: "institutional",
    jumpLabel: "Institutional",
    eyebrow: "03 · Institutional",
    title: "Where People Come First.",
    lede: "Schools, hospitals and public sites need security that protects without intimidating, and that holds up when it matters.",
    image: images.guardJacket,
    items: [
      {
        num: "07",
        title: "Schools",
        body: "A calm, steady presence for students, staff and campus events.",
        tags: ["Unarmed guards", "Cameras"],
      },
      {
        num: "08",
        title: "Hospitals",
        body: "Around-the-clock coverage for entrances, emergency departments and parking.",
        tags: ["Guards", "Lot patrol", "24/7 monitoring"],
      },
      {
        num: "09",
        title: "Government Sites",
        body: "Disciplined coverage, including armed guards and off-duty police officers.",
        tags: ["Armed guards", "Off-duty police", "Cameras"],
      },
    ],
  },
];

/* --------------------------------------------------------------------------
   Dispatch band (home)
   -------------------------------------------------------------------------- */

export const dispatchPoints: { term: string; description: string }[] = [
  { term: "Cameras", description: "Installed and solar systems, watched live." },
  { term: "Vehicles", description: "Every patrol unit stays in contact with dispatch." },
  { term: "Response", description: "One number to call, any hour, any day." },
];

/* --------------------------------------------------------------------------
   Approach steps
   -------------------------------------------------------------------------- */

export const approachSteps: { num: string; title: string; body: string }[] = [
  {
    num: "01",
    title: "Tell Us About Your Site",
    body: "Layout, entry points, hours, past incidents. We go over it with you, on site or on a call.",
  },
  {
    num: "02",
    title: "We Build the Plan",
    body: "Guards, cameras, patrol or a mix, sized to the real risk and to the budget you’re working with.",
  },
  {
    num: "03",
    title: "We Stand Watch",
    body: "Coverage starts, often the same day. Dispatch monitors it 24/7, and we adjust as your needs change.",
  },
];

/* --------------------------------------------------------------------------
   FAQ (home + contact)
   -------------------------------------------------------------------------- */

export type FaqItem = { question: string; answer: ReactNode };

export const faqs: FaqItem[] = [
  {
    question: "Are you licensed and insured?",
    answer: (
      <>
        <strong>Yes.</strong> Edgeway Security Inc. is fully licensed and insured.
      </>
    ),
  },
  {
    question: "Do you offer same-day guard services?",
    answer: (
      <>
        <strong>Yes, we do.</strong> If you need a guard on site today, call us and we’ll get coverage
        moving.
      </>
    ),
  },
  {
    question: "Do you have options for different budgets?",
    answer: (
      <>
        <strong>Absolutely.</strong> We look at what works for you, your site and your budget, and plan
        your security accordingly.
      </>
    ),
  },
  {
    question: "Where do you provide your services?",
    answer: (
      <>
        <strong>All across California.</strong> Tell us where your site is and we’ll take it from there.
      </>
    ),
  },
];

/* --------------------------------------------------------------------------
   Quote form options
   -------------------------------------------------------------------------- */

export const quoteServices: { value: string; key?: Service["key"] }[] = [
  { value: "Security Guards", key: "guards" },
  { value: "Cameras", key: "cameras" },
  { value: "Vehicle Patrol", key: "patrol" },
  { value: "Not sure yet" },
];

export const siteTypeGroups: { group: string; options: string[] }[] = [
  { group: "Commercial", options: ["Store", "Shopping Center", "Plaza"] },
  { group: "Industrial", options: ["Construction Site", "Warehouse", "Dam"] },
  { group: "Institutional", options: ["School", "Hospital", "Government Site"] },
];

export const siteTypeExtras = ["Shipment / Escort", "Other"];

export const coverageTimings = ["Today", "This week", "This month", "Just planning"];
