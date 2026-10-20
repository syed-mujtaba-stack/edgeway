import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SiteImageRow } from "@/types/db";
import { repo } from "@/lib/repo";

type ImageMap = Record<string, SiteImageRow>;

const SiteImagesContext = createContext<ImageMap>({});

/** Dispatched by the admin after an upload so the site updates without a reload. */
export const IMAGES_UPDATED_EVENT = "edgeway:images-updated";

export function notifyImagesUpdated() {
  window.dispatchEvent(new Event(IMAGES_UPDATED_EVENT));
}

/**
 * Loads the admin-managed image overrides once and keeps them fresh. Failures
 * are silent on purpose: the bundled originals always render if anything is
 * unreachable, so the public site can never be broken by the backend.
 */
export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<ImageMap>({});

  const load = useCallback(() => {
    repo()
      .listImages()
      .then((rows) => setMap(Object.fromEntries(rows.map((row) => [row.slot, row]))))
      .catch(() => setMap({}));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(IMAGES_UPDATED_EVENT, load);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(IMAGES_UPDATED_EVENT, load);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const value = useMemo(() => map, [map]);
  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>;
}

export function useImageOverride(slot?: string): SiteImageRow | undefined {
  const map = useContext(SiteImagesContext);
  return slot ? map[slot] : undefined;
}
