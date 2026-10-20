import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { services } from "@/data/site";
import { NavArrow, ResponsiveImage } from "@/components/primitives";

/**
 * Home-page services selector.
 *
 * Same behaviour as the original script: a real ARIA tablist, arrow/Home/End
 * keyboard support, and the selected tab mirrored into ?service=… with
 * history.replaceState (so the choice is shareable and survives a reload).
 */
export function ServicesTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get("service");
  const initial = Math.max(
    0,
    services.findIndex((s) => s.key === fromUrl),
  );
  const [active, setActive] = useState(initial);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // keep in sync if the URL changes from the outside (e.g. Services page CTA)
  useEffect(() => {
    if (!fromUrl) return;
    const i = services.findIndex((s) => s.key === fromUrl);
    if (i >= 0) setActive(i);
  }, [fromUrl]);

  const select = (index: number, focus = false) => {
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();

    const next = new URLSearchParams(searchParams);
    next.set("service", services[index].key);
    setSearchParams(next, { replace: true });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in step) {
      e.preventDefault();
      select((index + step[e.key] + services.length) % services.length, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(e.key === "Home" ? 0 : services.length - 1, true);
    }
  };

  const activeService = useMemo(() => services[active], [active]);

  return (
    <div className="tabs is-ready">
      <div className="tabs__list" role="tablist" aria-label="Services">
        {services.map((service, i) => (
          <button
            key={service.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            className="tab"
            type="button"
            role="tab"
            id={`tab-${service.key}`}
            aria-controls={`panel-${service.key}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className="num">{String(i + 1).padStart(2, "0")}</span>
            {service.tab}
          </button>
        ))}
      </div>

      {services.map((service, i) => (
        <div
          key={service.key}
          className="panel"
          role="tabpanel"
          id={`panel-${service.key}`}
          aria-labelledby={`tab-${service.key}`}
          hidden={i !== active}
        >
          <div className="frame panel__media">
            <ResponsiveImage
              image={service.image}
              sizes="(min-width: 56rem) 42rem, 100vw"
              loading={activeService.key === service.key ? "eager" : "lazy"}
            />
          </div>
          <div className="panel__body">
            <h3 className="h2">{service.home.title}</h3>
            <p className="lede">{service.home.lede}</p>
            <ul className="offers">
              {service.home.offerings.map((offer) => (
                <li key={offer.num}>
                  <span className="num">{offer.num}</span>
                  <strong>{offer.title}</strong>
                  <p>{offer.body}</p>
                </li>
              ))}
            </ul>
            <NavArrow caps to={`/services#${service.key}`}>
              {service.home.ctaLabel}
            </NavArrow>
          </div>
        </div>
      ))}
    </div>
  );
}
