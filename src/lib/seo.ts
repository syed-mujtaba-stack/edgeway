import { useEffect } from "react";

export type SeoProps = {
  title: string;
  description: string;
  image?: string;
  ogTitle?: string;
  ogDescription?: string;
};

const SITE_NAME = "Edgeway Security Inc.";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Per-page <title> / description / Open Graph tags — the React equivalent of
 * the <head> block that used to be hand-written in each HTML file.
 */
export function Seo({ title, description, image = "/assets/img/guard-line-1200.webp", ogTitle, ogDescription }: SeoProps) {
  useEffect(() => {
    document.title = title;

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", ogTitle ?? title);
    setMeta('meta[property="og:description"]', "property", "og:description", ogDescription ?? description);
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  }, [title, description, image, ogTitle, ogDescription]);

  return null;
}
