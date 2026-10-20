import { useState } from "react";
import { BUILD_TAG } from "@/lib/env";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/admin/state";
import { isDemo } from "@/lib/repo";
import { images } from "@/data/site";
import { ResponsiveImage } from "@/components/primitives";

export function Login() {
  const { user, ready, signIn } = useAdmin();
  const location = useLocation();
  const [email, setEmail] = useState(isDemo() ? "admin@edgewaysecurity.com" : "");
  const [password, setPassword] = useState(isDemo() ? "edgeway123" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (ready && user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/admin";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm adm-login">
      <div className="adm-login__card">
        <div className="adm-login__brand">
          <ResponsiveImage image={images.crest} />
          <div>
            <strong>Edgeway Security</strong>
            <span>Admin dashboard</span>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="adm-login__lede">
          Manage quote requests and the imagery on edgewaysecurity.com.
        </p>

        {error ? <div className="adm-login__error">{error}</div> : null}

        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="adm-email">Email</label>
            <input
              id="adm-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="adm-password">Password</label>
            <input
              id="adm-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {isDemo() ? (
          <p className="adm-login__hint">
            <strong>Demo mode.</strong> No Supabase keys are configured, so the dashboard runs on
            local demo data. Any email works — use a password of 4+ characters. Add
            <code> VITE_SUPABASE_URL </code> and <code> VITE_SUPABASE_ANON_KEY </code> to switch to
            the live backend.
          </p>
        ) : null}

        <p className="adm-login__build">Build {BUILD_TAG}</p>
      </div>
    </div>
  );
}
