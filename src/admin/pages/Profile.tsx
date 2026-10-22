import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isDemo } from "@/lib/repo";
import { useAdmin, useToasts } from "@/admin/state";

export function Profile() {
  const { user, updatePassword } = useAdmin();
  const { push } = useToasts();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      push({ tone: "error", title: "Password is too short", body: "Use at least 8 characters." });
      return;
    }
    if (password !== confirmation) {
      push({ tone: "error", title: "Passwords do not match" });
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmation("");
      push({ tone: "ok", title: "Password updated", body: "Your new password is ready to use." });
    } catch (error) {
      push({ tone: "error", title: "Could not update password", body: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Personal profile</h2>
        </div>
        <div className="adm-kv adm-kv--2">
          <div className="adm-fact">
            <dt>Name</dt>
            <dd className="adm-fact__value">{user?.name}</dd>
          </div>
          <div className="adm-fact">
            <dt>Email</dt>
            <dd className="adm-fact__value">{user?.email}</dd>
          </div>
          <div className="adm-fact">
            <dt>Role</dt>
            <dd className="adm-fact__value">{user?.role}</dd>
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>{searchParams.get("reset") ? "Set a new password" : "Change password"}</h2>
        </div>
        <p className="adm-form-note">
          Use a unique password with at least 8 characters. You will stay signed in after changing it.
        </p>
        <form className="form adm-form" onSubmit={savePassword}>
          <div className="field">
            <label htmlFor="profile-password">New password</label>
            <input
              id="profile-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="profile-password-confirm">Confirm new password</label>
            <input
              id="profile-password-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
        {isDemo() ? <p className="adm-form-note">Demo mode saves this password in this browser only.</p> : null}
      </div>
    </>
  );
}
