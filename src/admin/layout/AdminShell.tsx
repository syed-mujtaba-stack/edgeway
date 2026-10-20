import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BUILD_TAG } from "@/lib/env";
import { useAdmin, useToasts } from "@/admin/state";
import { isDemo } from "@/lib/repo";
import { images } from "@/data/site";
import { ResponsiveImage } from "@/components/primitives";
import {
  IconBell,
  IconClose,
  IconHome,
  IconImage,
  IconInbox,
  IconLogout,
  IconSettings,
} from "@/admin/components/icons";

const navItems = [
  { to: "/admin", label: "Overview", icon: IconHome, end: true },
  { to: "/admin/inquiries", label: "Inquiries", icon: IconInbox, badge: true },
  { to: "/admin/images", label: "Images", icon: IconImage },
  { to: "/admin/notifications", label: "Notifications", icon: IconBell },
  { to: "/admin/settings", label: "Settings", icon: IconSettings },
];

const mobileItems = navItems.slice(0, 4);

const titles: Record<string, { title: string; sub: string }> = {
  "/admin": { title: "Overview", sub: "Today at a glance" },
  "/admin/inquiries": { title: "Inquiries", sub: "Every quote request, live" },
  "/admin/images": { title: "Images", sub: "Update the imagery on the public site" },
  "/admin/notifications": { title: "Notifications", sub: "Push alerts for new inquiries" },
  "/admin/settings": { title: "Settings", sub: "Business details and account" },
};

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="adm__nav-badge">{count > 99 ? "99+" : count}</span>;
}

export function AdminShell() {
  const { user, unread, signOut } = useAdmin();
  const { toasts, dismiss } = useToasts();
  const { pathname } = useLocation();

  const header =
    titles[pathname] ??
    (pathname.startsWith("/admin/inquiries/")
      ? { title: "Inquiry", sub: "Full request and history" }
      : { title: "Admin", sub: "" });

  return (
    <div className="adm">
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <ResponsiveImage image={images.crest} />
          <div>
            <strong>Edgeway</strong>
            <em>Admin</em>
          </div>
        </div>

        <nav className="adm__nav" aria-label="Admin sections">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <item.icon />
              {item.label}
              {item.badge ? <Badge count={unread} /> : null}
            </NavLink>
          ))}
        </nav>

        <div className="adm__sidebar-foot">
          <p className="adm__mode" data-mode={isDemo() ? "demo" : "supabase"}>
            <i /> {isDemo() ? "Demo data" : "Supabase live"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--ink-3)" }}>{user?.email}</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--ink-3)", opacity: 0.75 }}>{BUILD_TAG}</p>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => void signOut()}>
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      <div className="adm__main">
        <div className="adm__topbar">
          <div className="adm__mobile-brand">
            <span className="adm__mobile-crest">
              <ResponsiveImage image={images.crest} />
            </span>
            <div>
              <h1>{header.title}</h1>
              <p className="adm__topbar-sub">{header.sub}</p>
            </div>
          </div>
          <div style={{ display: "none" }}>
            <h1>{header.title}</h1>
          </div>
          <div className="adm__topbar-actions">
            <NavLink
              className="btn btn--outline btn--sm"
              to="/"
              target="_blank"
              rel="noreferrer"
              title="Open the public site"
            >
              View site
            </NavLink>
          </div>
        </div>

        <div className="adm__content">
          <Outlet />
        </div>
      </div>

      <nav className="adm__bottom" aria-label="Admin sections">
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <item.icon />
            {item.label}
            {item.badge && unread ? (
              <span className="adm__bottom-badge">{unread > 9 ? "9+" : unread}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="adm-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className="adm-toast" key={toast.id} data-tone={toast.tone}>
            <span className="adm-toast__dot" aria-hidden="true" />
            <div>
              <strong>{toast.title}</strong>
              {toast.body ? <span>{toast.body}</span> : null}
            </div>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <IconClose />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
