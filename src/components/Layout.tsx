import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header, TopBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";

/**
 * Scroll behaviour of the original site:
 *  - new page → back to the top
 *  - link with a #hash (e.g. /contact#quote) → scroll that section into view,
 *    with the sticky header accounted for by `scroll-padding-top` in the CSS.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // wait a frame so the new page has painted before measuring
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
          // focusable targets get focus so keyboard users land in the right place
          if (el instanceof HTMLElement && el.tabIndex === -1) el.focus({ preventScroll: true });
        } else {
          window.scrollTo(0, 0);
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return null;
}

export function Layout() {
  return (
    <>
      <ScrollManager />
      <a className="skip-link" href="#main">
        Skip to Content
      </a>
      <TopBar />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
    </>
  );
}
