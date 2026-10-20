import { images, type ImageSpec } from "@/data/site";

/**
 * Every editable image on the site, in one list. The admin dashboard renders a
 * card per slot and the public site resolves each <ResponsiveImage slot="…">
 * against the database, falling back to the bundled original.
 */
export type ImageSlot = {
  key: string;
  label: string;
  page: "home" | "services" | "industries" | "contact" | "global";
  hint: string;
  default: ImageSpec;
  defaultAlt: string;
};

export const imageSlots: ImageSlot[] = [
  {
    key: "hero",
    label: "Home hero",
    page: "home",
    hint: "Wide banner under the headline — 2400 × 879 recommended.",
    default: images.hero,
    defaultAlt: images.hero.alt,
  },
  {
    key: "service_guards",
    label: "Security guards",
    page: "home",
    hint: "Used on the home tab and the Services page.",
    default: images.guardJacket,
    defaultAlt: images.guardJacket.alt,
  },
  {
    key: "service_cameras",
    label: "Cameras",
    page: "home",
    hint: "Home tab, Services page and the Industrial sector card.",
    default: images.cameraInstall,
    defaultAlt: images.cameraInstall.alt,
  },
  {
    key: "service_patrol",
    label: "Vehicle patrol",
    page: "home",
    hint: "Home tab and the Services page.",
    default: images.patrolLightbar,
    defaultAlt: images.patrolLightbar.alt,
  },
  {
    key: "dispatch",
    label: "Dispatch band",
    page: "home",
    hint: "Dark band on the home page — a dispatcher at the camera wall.",
    default: images.dispatch,
    defaultAlt: images.dispatch.alt,
  },
  {
    key: "control_room",
    label: "Control room",
    page: "services",
    hint: "Dark band on the Services page.",
    default: images.controlRoom,
    defaultAlt: images.controlRoom.alt,
  },
  {
    key: "night_patrol",
    label: "Night patrol",
    page: "global",
    hint: "Industries hero and the closing CTA band on every page.",
    default: images.nightPatrol,
    defaultAlt: images.nightPatrol.alt,
  },
  {
    key: "crest",
    label: "Logo crest",
    page: "global",
    hint: "Header and footer wordmark. Use a square or portrait PNG with transparency.",
    default: images.crest,
    defaultAlt: "Edgeway Security crest",
  },
];

export const slotByKey = (key: string) => imageSlots.find((s) => s.key === key);
