import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BusinessSettings } from "@/types/db";
import { repo, isDemo } from "@/lib/repo";
import { download } from "@/lib/format";
import { useAdmin, useToasts } from "@/admin/state";

const fields: { key: keyof BusinessSettings; label: string; hint?: string }[] = [
  { key: "phoneDisplay", label: "Phone (as shown)" },
  { key: "phoneHref", label: "Phone link", hint: "tel:+1… format" },
  { key: "email", label: "Email address" },
  { key: "addressLine1", label: "Street address" },
  { key: "addressLine2", label: "City, state, ZIP" },
  { key: "ppo", label: "Licence / PPO number" },
  { key: "notifyEmail", label: "Notification email", hint: "Where lead alerts are also emailed" },
];

export function Settings() {
  const { user, signOut, inquiries } = useAdmin();
  const { push } = useToasts();
  const [values, setValues] = useState<BusinessSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    repo()
      .getSettings()
      .then(setValues)
      .catch(() => setValues(null));
  }, []);

  const save = async () => {
    if (!values) return;
    setBusy(true);
    try {
      await repo().saveSettings(values);
      push({ tone: "ok", title: "Settings saved" });
    } catch (e) {
      push({ tone: "error", title: "Could not save", body: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const exportAll = () => {
    download(
      `edgeway-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), inquiries }, null, 2),
      "application/json",
    );
  };

  return (
    <>
      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Business details</h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-3)", marginBottom: "1rem" }}>
          These are the contact details shown across the public site. Saving here updates the records
          the site reads; the footer/header copy is rendered from the same source.
        </p>

        {values ? (
          <div className="adm-kv adm-kv--2">
            {fields.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={`set-${field.key}`}>
                  {field.label}
                  {field.hint ? <span className="opt"> ({field.hint})</span> : null}
                </label>
                <input
                  id={`set-${field.key}`}
                  value={values[field.key]}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="adm-skeleton">
            <div />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button className="btn" type="button" disabled={!values || busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save details"}
          </button>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Account</h2>
        </div>
        <div className="adm-facts">
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
          <div className="adm-fact">
            <dt>Mode</dt>
            <dd className="adm-fact__value">{isDemo() ? "Demo (local data)" : "Supabase (live)"}</dd>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button className="btn btn--outline btn--sm" type="button" onClick={exportAll}>
            Export all inquiries (JSON)
          </button>
          <Link className="btn btn--outline btn--sm" to="/admin/profile">
            Personal profile
          </Link>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>

      {isDemo() ? (
        <div className="adm-note-banner">
          <div>
            <strong>Demo data lives in this browser only.</strong> Clearing site data resets the
            dashboard to its seeded examples. Connect Supabase (see{" "}
            <code>docs/deploy-and-keys.md</code>) to switch to the live backend with real logins,
            real storage and push that works with the browser closed.
          </div>
        </div>
      ) : null}
    </>
  );
}
