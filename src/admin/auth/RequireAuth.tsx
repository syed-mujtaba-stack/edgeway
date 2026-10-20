import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "@/admin/state";

export function RequireAuth() {
  const { user, ready } = useAdmin();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="adm adm-login">
        <div className="adm-login__card">
          <p style={{ fontSize: "0.875rem", color: "var(--ink-3)" }}>Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
