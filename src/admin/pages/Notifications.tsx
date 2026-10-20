import { Link } from "react-router-dom";
import { usePush } from "@/admin/hooks/usePush";
import { relativeTime } from "@/lib/format";
import { IconBell, IconInfo, IconTrash } from "@/admin/components/icons";

export function Notifications() {
  const { permission, devices, subscribed, realPush, busy, error, enable, disable, test } = usePush();

  const granted = permission === "granted";

  return (
    <>
      <div className="adm-card" style={{ display: "grid", gap: "1rem" }}>
        <div className="adm-card__head">
          <h2>Push notifications</h2>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--ink-2)", maxWidth: "46rem" }}>
          Get an alert on this device the moment a quote request arrives — even when this tab is in
          the background or the browser is closed. Each device is registered separately, so you can
          have your phone and laptop both covered.
        </p>

        <div className="adm-toggle">
          <div className="adm-toggle__text">
            <strong>This device</strong>
            <span>
              {permission === "unsupported"
                ? "This browser does not support notifications."
                : granted && subscribed
                  ? "Notifications are on."
                  : permission === "denied"
                    ? "Blocked in browser settings — re-enable for this site, then try again."
                    : "Off — turn on to be alerted instantly."}
            </span>
          </div>
          <button
            className="adm-switch"
            type="button"
            role="switch"
            aria-checked={granted && subscribed}
            aria-label="Enable notifications on this device"
            disabled={busy || permission === "unsupported"}
            onClick={() => {
              if (granted && subscribed) {
                const current = devices[0];
                if (current) void disable(current.id);
              } else {
                void enable();
              }
            }}
          />
        </div>

        {error ? <p style={{ color: "#8f1d15", fontSize: "0.875rem" }}>{error}</p> : null}

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn--sm" type="button" onClick={() => void test()} disabled={!granted}>
            <IconBell /> Send test notification
          </button>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => void enable()} disabled={busy}>
            Re-register this device
          </button>
        </div>

        {!realPush ? (
          <div className="adm-note-banner">
            <IconInfo />
            <div>
              <strong>Demo mode:</strong> notifications are delivered through the service worker while
              the dashboard (or an installed app window) is open. To deliver alerts with the browser
              fully closed, add <code>VITE_VAPID_PUBLIC_KEY</code> plus the Supabase keys — the Edge
              Function then sends real web push to every registered device.
            </div>
          </div>
        ) : null}
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Registered devices</h2>
          <div className="adm-card__head-actions">
            <span style={{ fontSize: "0.75rem", color: "var(--ink-3)" }}>{devices.length} total</span>
          </div>
        </div>

        {devices.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--ink-3)" }}>
            No devices yet. Turn notifications on above to register this one.
          </p>
        ) : (
          <div className="adm-devices">
            {devices.map((device) => (
              <div className="adm-device" key={device.id}>
                <IconBell />
                <div className="adm-device__meta">
                  <strong>{device.device || "Unknown device"}</strong>
                  <span>
                    Added {relativeTime(device.createdAt)}
                    {device.lastOkAt ? ` · last delivered ${relativeTime(device.lastOkAt)}` : ""}
                  </span>
                </div>
                <button
                  className="btn btn--outline btn--sm"
                  type="button"
                  onClick={() => void disable(device.id)}
                  aria-label="Remove device"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="adm-card" style={{ display: "grid", gap: "0.75rem" }}>
        <div className="adm-card__head">
          <h2>Install the app (required on iPhone)</h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-2)" }}>
          Edgeway Admin is a PWA — install it and it opens full-screen like a native app, works
          offline, and on iOS it is the only way push notifications can be delivered.
        </p>
        <ol style={{ fontSize: "0.875rem", color: "var(--ink-2)", paddingLeft: "1.1rem", display: "grid", gap: "0.35rem" }}>
          <li>
            <strong>iPhone / iPad:</strong> open this page in Safari → Share → <em>Add to Home Screen</em>.
          </li>
          <li>
            <strong>Android:</strong> Chrome menu → <em>Install app</em> (or use the install button in
            the browser bar).
          </li>
          <li>
            <strong>Desktop:</strong> the install icon in the address bar, or Chrome menu →{" "}
            <em>Install Edgeway Admin</em>.
          </li>
        </ol>
        <p style={{ fontSize: "0.8125rem", color: "var(--ink-3)" }}>
          Need the public site instead? <Link to="/" className="text-link">Open edgewaysecurity.com</Link>
        </p>
      </div>
    </>
  );
}
