import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mobileNav, primaryNav } from "@/data/site";
import { useSiteCompany } from "@/context/SiteSettings";
import { useMediaQuery, useScrolled } from "@/hooks";
import { ResponsiveImage } from "@/components/primitives";
import { images } from "@/data/site";

export function TopBar() {
  const company = useSiteCompany();

  return (
    <div className="topbar on-dark">
      <div className="container topbar__inner">
        <span className="topbar__item">Licensed &amp; insured</span>
        <span className="topbar__item">{company.ppo}</span>
        <span className="topbar__item topbar__extra">{company.serviceArea}</span>
      </div>
    </div>
  );
}

export function Header() {
  const company = useSiteCompany();
  const { pathname } = useLocation();
  const scrolled = useScrolled(8);
  const isDesktop = useMediaQuery("(min-width: 52rem)");
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** close the mobile menu on navigation */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /** close when the viewport grows past the mobile breakpoint */
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  /** Escape closes and returns focus to the toggle */
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    },
    [open],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const isCurrent = (navPath: string) => {
    if (navPath.includes("#")) return false;
    if (navPath === "/") return pathname === "/";
    return pathname.startsWith(navPath);
  };

  return (
    <header
      className={["header", scrolled ? "is-scrolled" : null, open ? "is-open" : null]
        .filter(Boolean)
        .join(" ")}
      data-header=""
    >
      <div className="container header__inner">
        <Link className="brand" to="/" aria-label={`${company.name}, home`}>
          <ResponsiveImage image={images.crest} loading="eager" />
          <span className="brand__name" translate="no">
            Edgeway<span>Security Inc.</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link to={item.to} aria-current={isCurrent(item.to) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <a className="header__phone" href={company.phoneHref}>
            {company.phoneDisplay}
          </a>
          <Link className="btn btn--sm header__quote" to="/contact#quote">
            Get a Quote
          </Link>
          <button
            ref={buttonRef}
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="menu-btn__icon" aria-hidden="true" />
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      <div className="mobile-nav" id="mobile-nav">
        <nav aria-label="Mobile">
          {mobileNav.map((item) => (
            <Link
              key={item.label}
              className="mobile-nav__link"
              to={item.to}
              aria-current={isCurrent(item.to) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-nav__actions">
          <a className="btn" href={company.phoneHref}>
            Call {company.phoneDisplay}
          </a>
          <Link className="btn btn--outline" to="/contact#quote" onClick={() => setOpen(false)}>
            Request a Quote
          </Link>
        </div>
      </div>
    </header>
  );
}
