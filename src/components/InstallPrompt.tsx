import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { canInstall, isStandalone, promptInstall } from "@/lib/pwa";

/**
 * Small, dismissible install nudge. Shown only when the browser actually offers
 * an install prompt, and never twice after the visitor dismisses it.
 */
const DISMISS_KEY = "edgeway.install-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      if (isStandalone()) return;
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      if (canInstall()) setVisible(true);
    };
    check();
    window.addEventListener("edgeway:install-available", check);
    window.addEventListener("edgeway:installed", () => setVisible(false));
    return () => {
      window.removeEventListener("edgeway:install-available", check);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside className="install-prompt" aria-label="Install the Edgeway app">
      <div>
        <strong>Install Edgeway</strong>
        <p>Save the site to your home screen for one-tap access.</p>
      </div>
      <div className="install-prompt__actions">
        <button
          className="btn btn--sm"
          type="button"
          onClick={async () => {
            const accepted = await promptInstall();
            if (!accepted) setVisible(false);
          }}
        >
          Install
        </button>
        <button
          className="btn btn--outline btn--sm"
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          Not now
        </button>
      </div>
      <Link to="/admin" className="install-prompt__admin">
        Admin login
      </Link>
    </aside>
  );
}
