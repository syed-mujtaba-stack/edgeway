import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { AdminProvider } from "@/admin/state";
import { Login } from "@/admin/auth/Login";
import { RequireAuth } from "@/admin/auth/RequireAuth";
import { AdminShell } from "@/admin/layout/AdminShell";
import { Overview } from "@/admin/pages/Overview";
import { Inquiries } from "@/admin/pages/Inquiries";
import { InquiryDetail } from "@/admin/pages/InquiryDetail";
import { Images } from "@/admin/pages/Images";
import { Notifications } from "@/admin/pages/Notifications";
import { Settings } from "@/admin/pages/Settings";
import { Profile } from "@/admin/pages/Profile";
import "@/admin/admin.css";

/** Point the installed PWA at the admin manifest + navy status bar while inside /admin. */
function AdminHead() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previous = { manifest: link?.href, theme: theme?.content };
    if (link) link.href = "/admin-manifest.webmanifest";
    if (theme) theme.content = "#000b33";
    return () => {
      if (link && previous.manifest) link.href = previous.manifest;
      if (theme && previous.theme) theme.content = previous.theme;
    };
  }, []);
  return null;
}

/**
 * Everything behind /admin. Mounted as its own route tree so the dashboard
 * ships with its own stylesheet and never leaks admin UI into the public site.
 */
export function AdminApp() {
  return (
    <AdminProvider>
      <AdminHead />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminShell />}>
            <Route index element={<Overview />} />
            <Route path="inquiries" element={<Inquiries />}>
              <Route path=":id" element={<InquiryDetail />} />
            </Route>
            <Route path="images" element={<Images />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </AdminProvider>
  );
}
