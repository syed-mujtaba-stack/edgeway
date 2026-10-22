import { useState } from "react";
import { BUILD_TAG } from "@/lib/env";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/admin/state";
import { isDemo } from "@/lib/repo";
import { images } from "@/data/site";
import { ResponsiveImage } from "@/components/primitives";

export function Login() {
  const { user, ready, signIn, resetPassword } = useAdmin();
  const location = useLocation();
  const [email, setEmail] = useState(isDemo() ? "admin@edgewaysecurity.com" : "");
  const [password, setPassword] = useState(isDemo() ? "edgeway123" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState("");

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

  const onForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await resetPassword(email);
      setNotice(
        isDemo()
          ? "Demo mode does not send email. Open your profile after signing in to set a new password."
          : "If an account exists for this email, a password reset link has been sent.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link");
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

        <h1>{forgot ? "Reset password" : "Sign in"}</h1>
        <p className="adm-login__lede">
          {forgot ? "Enter your admin email and we will send a secure reset link." : "Manage quote requests and the imagery on edgewaysecurity.com."}
        </p>

        {error ? <div className="adm-login__error">{error}</div> : null}
        {notice ? <div className="adm-login__notice">{notice}</div> : null}

        <form className="form" onSubmit={forgot ? onForgotPassword : onSubmit}>
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
          {!forgot ? (
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
          ) : null}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? (forgot ? "Sending…" : "Signing in…") : forgot ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <button
          className="adm-login__link"
          type="button"
          onClick={() => {
            setForgot(!forgot);
            setError("");
            setNotice("");
          }}
        >
          {forgot ? "Back to sign in" : "Forgot password?"}
        </button>

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
