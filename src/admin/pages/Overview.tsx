import { Link } from "react-router-dom";
import { useAdmin } from "@/admin/state";
import { usePush } from "@/admin/hooks/usePush";
import { isDemo } from "@/lib/repo";
import { relativeTime } from "@/lib/format";
import { IconBell, IconImage, IconInfo, IconInbox } from "@/admin/components/icons";
import { StatusPill } from "@/admin/components/StatusPill";

export function Overview() {
  const { stats, inquiries, loading, simulate, user } = useAdmin();
  const push = usePush();

  const recent = inquiries.filter((i) => i.status !== "spam").slice(0, 5);
  const needsAction = inquiries.filter((i) => i.status === "new" && !i.isRead).length;

  return (
    <>
      <div className="adm-stats">
        <div className="adm-stat adm-stat--accent">
          <div className="adm-stat__label">Unread</div>
          <div className="adm-stat__value">{stats.unread}</div>
          <div className="adm-stat__note">waiting for a first reply</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Today</div>
          <div className="adm-stat__value">{stats.today}</div>
          <div className="adm-stat__note">requests since midnight</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">This week</div>
          <div className="adm-stat__value">{stats.week}</div>
          <div className="adm-stat__note">last 7 days</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Quoted</div>
          <div className="adm-stat__value">{stats.byStatus.quoted + stats.byStatus.won}</div>
          <div className="adm-stat__note">{stats.byStatus.won} won so far</div>
        </div>
      </div>

      {isDemo() ? (
        <div className="adm-note-banner">
          <IconInfo />
          <div>
            <strong>Demo mode.</strong> This dashboard is running on local demo data (no Supabase
            keys configured). New requests you submit on the public <Link to="/contact">contact
            form</Link> appear here instantly and fire a browser notification — exactly like the live
            system. Use the button below to simulate an incoming lead.
          </div>
        </div>
      ) : null}

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Latest requests</h2>
          <div className="adm-card__head-actions">
            {isDemo() ? (
              <button className="btn btn--outline btn--sm" type="button" onClick={() => void simulate()}>
                Simulate incoming lead
              </button>
            ) : null}
            <Link className="btn btn--sm" to="/admin/inquiries">
              Open inbox
            </Link>
          </div>
        </div>

        {loading && inquiries.length === 0 ? (
          <div className="adm-skeleton">
            <div />
            <div />
            <div />
          </div>
        ) : recent.length === 0 ? (
          <div className="adm-empty">
            <IconInbox />
            <strong>No requests yet</strong>
            <p>When someone fills in the quote form, it lands here in real time.</p>
          </div>
        ) : (
          <div className="adm-list">
            {recent.map((inquiry) => (
              <Link
                key={inquiry.id}
                to={`/admin/inquiries/${inquiry.id}`}
                className={`adm-row ${inquiry.isRead ? "" : "adm-row--unread"}`}
              >
                <span className="adm-row__dot" aria-hidden="true" />
                <span className="adm-row__main">
                  <span className="adm-row__name">
                    {inquiry.name}
                    <StatusPill status={inquiry.status} />
                  </span>
                  <span className="adm-row__meta">
                    {[inquiry.siteType, inquiry.location, inquiry.services.join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="adm-row__time">{relativeTime(inquiry.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: "1fr" }}>
        <div className="adm-toggle">
          <div className="adm-toggle__text">
            <strong>Push notifications on this device</strong>
            <span>
              {push.subscribed
                ? "Enabled — you will be alerted even when this tab is in the background."
                : push.permission === "granted"
                  ? "Permission granted, but this device is not registered yet — finish setting it up."
                  : "Off — enable to get an alert the moment a request arrives."}
            </span>
          </div>
          <Link className="btn btn--outline btn--sm" to="/admin/notifications">
            <IconBell /> Manage
          </Link>
        </div>

        <div className="adm-toggle">
          <div className="adm-toggle__text">
            <strong>Site images</strong>
            <span>Hero, service photos, dispatch band, logo — all editable without a deploy.</span>
          </div>
          <Link className="btn btn--outline btn--sm" to="/admin/images">
            <IconImage /> Edit images
          </Link>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--ink-3)" }}>
        Signed in as {user?.name} ({user?.role}) · {needsAction} new request
        {needsAction === 1 ? "" : "s"} not opened yet.
      </p>
    </>
  );
}
