import type React from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode, Ref } from "react";
import { Link } from "react-router-dom";
import type { ImageSpec } from "@/data/site";
import { useReveal } from "@/hooks";
import { bundledImageSrc } from "@/data/site";
import { useImageOverride } from "@/context/SiteImages";

/* --------------------------------------------------------------------------
   Reveal — wraps children so they fade/slide in on first scroll into view,
   exactly like the original [data-reveal] / [data-d] attributes.
   -------------------------------------------------------------------------- */

type RevealProps = {
  children: ReactNode;
  /** stagger step: 1 → 80ms, 2 → 160ms, 3 → 240ms */
  delay?: 0 | 1 | 2 | 3;
  as?:
    | "div"
    | "p"
    | "li"
    | "section"
    | "article"
    | "figure"
    | "nav"
    | "ol"
    | "ul"
    | "span"
    | "h1"
    | "h2"
    | "h3"
    | "dl";
  className?: string;
  id?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Reveal({ children, delay = 0, as: Tag = "div", className, id, ...rest }: RevealProps) {
  const { ref, shown } = useReveal<HTMLElement>();

  return (
    <Tag
      ref={ref as Ref<never>}
      id={id}
      className={[className, shown ? "is-in" : null].filter(Boolean).join(" ") || undefined}
      data-reveal=""
      {...(delay ? { "data-d": String(delay) } : {})}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Arrow — the small 16px arrow used in links and buttons
   -------------------------------------------------------------------------- */

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}

export type LinkArrowProps = {
  href: string;
  children: ReactNode;
  caps?: boolean;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;

export function LinkArrow({ href, children, caps, className, ...rest }: LinkArrowProps) {
  return (
    <a
      href={href}
      className={["link-arrow", caps ? "link-arrow--caps" : null, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children} <Arrow />
    </a>
  );
}

/** Same look as LinkArrow, but routes client-side. */
export function NavArrow({
  to,
  children,
  caps,
  className,
}: {
  to: string;
  children: ReactNode;
  caps?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={["link-arrow", caps ? "link-arrow--caps" : null, className].filter(Boolean).join(" ")}
    >
      {children} <Arrow />
    </Link>
  );
}

/* --------------------------------------------------------------------------
   Responsive <picture> helper — emits the 1200w/2400w srcset of an ImageSpec
   -------------------------------------------------------------------------- */

type ResponsiveImageProps = {
  image: ImageSpec;
  /** the `sizes` attribute, straight from the original markup */
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** overrides ImageSpec.alt, e.g. "" for decorative background images */
  alt?: string;
  loading?: "lazy" | "eager";
};

const src = (image: ImageSpec, w: number) => `/assets/img/${image.name}-${w}.webp`;

export function ResponsiveImage({
  image,
  sizes,
  className,
  priority = false,
  alt,
  loading,
}: ResponsiveImageProps) {
  /** React 18 doesn't know the camel-cased prop; emit the lowercase attribute. */
  const eagerProps = (priority ? { fetchpriority: "high" } : {}) as React.ImgHTMLAttributes<HTMLImageElement>;
  const widths = image.widths;
  const isVectorLike = image.widths.length === 1;

  /* admin-managed override for this slot, if one has been uploaded */
  const override = useImageOverride(image.slot);
  const hasOverride = Boolean(override?.src2400);

  const resolvedSrc = hasOverride
    ? (override?.src1200 ?? override?.src2400 ?? "")
    : bundledImageSrc(image);

  const resolvedSrcSet = hasOverride
    ? [
        override?.src1200 ? `${override.src1200} 1200w` : null,
        override?.src2400 ? `${override.src2400} 2400w` : null,
      ]
        .filter(Boolean)
        .join(", ") || undefined
    : isVectorLike
      ? undefined
      : widths.map((w) => `${src(image, w)} ${w}w`).join(", ");

  return (
    <img
      className={className}
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes={resolvedSrcSet ? sizes : undefined}
      width={override?.width ?? image.width}
      height={override?.height ?? image.height}
      alt={alt ?? (hasOverride ? override?.alt || image.alt : image.alt)}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={priority ? "sync" : "async"}
      {...eagerProps}
    />
  );
}

/* --------------------------------------------------------------------------
   FAQ accordion — native <details>/<summary>, visually identical, but rendered
   from data and with the same plus/minus icon span.
   -------------------------------------------------------------------------- */

export function FAQList({
  items,
  delay = 0,
}: {
  items: { question: string; answer: ReactNode }[];
  delay?: 0 | 1 | 2 | 3;
}) {
  return (
    <Reveal className="faq" delay={delay}>
      {items.map((item) => (
        <details key={item.question}>
          <summary>
            {item.question}
            <span className="faq__icon" aria-hidden="true" />
          </summary>
          <p className="faq__a">{item.answer}</p>
        </details>
      ))}
    </Reveal>
  );
}
