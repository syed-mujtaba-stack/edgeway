import { useMemo, useState } from "react";
import { Link, Outlet, useMatch } from "react-router-dom";
import { useAdmin } from "@/admin/state";
import { isDemo } from "@/lib/repo";
import { download, relativeTime, toCsv } from "@/lib/format";
import { inquiryStatuses, type InquiryStatus } from "@/types/db";
import { StatusPill } from "@/admin/components/StatusPill";
import { IconDownload, IconInbox, IconSearch, IconTrash } from "@/admin/components/icons";

type Filter = InquiryStatus | "all" | "unread";

const csvColumns = [
  { key: "createdAt", label: "Received" },
  { key: "name", label: "Name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "services", label: "Services" },
  { key: "siteType", label: "Site type" },
  { key: "location", label: "Location" },
  { key: "timing", label: "Coverage needed" },
  { key: "status", label: "Status" },
  { key: "message", label: "Message" },
];

export function Inquiries() {
  const { inquiries, stats, simulate, loading, removeMany } = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  /** ids awaiting the "delete permanently?" confirmation (single row or bulk) */
  const [confirming, setConfirming] = useState<string[] | null>(null);

  const detailMatch = useMatch("/admin/inquiries/:id");
  const showDetail = Boolean(detailMatch);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (filter === "unread" && (i.isRead || i.status === "spam")) return false;
      if (filter !== "all" && filter !== "unread" && i.status !== filter) return false;
      if (!q) return true;
      return [i.name, i.company, i.email, i.phone, i.location, i.siteType, i.message, ...i.services]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [inquiries, filter, query]);

  const visibleIds = filtered.map((i) => i.id);
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  const toggleOne = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const toggleAll = () =>
    setSelected((list) => {
      const rest = list.filter((id) => !visibleIds.includes(id));
      return allVisibleSelected ? rest : [...rest, ...visibleIds];
    });

  const runDelete = async () => {
    const ids = confirming ?? [];
    setConfirming(null);
    setSelected((list) => list.filter((id) => !ids.includes(id)));
    await removeMany(ids);
  };

  const exportCsv = () => {
    const rows = filtered.map((i) => ({ ...i, services: i.services.join(", ") }));
    download(
      `edgeway-inquiries-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows, csvColumns),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <div className={showDetail ? "adm-inquiries adm-inquiries--detail" : "adm-inquiries adm-inquiries--single"}>
      <div style={{ display: showDetail ? "none" : "grid", gap: "1rem", minWidth: 0 }}>
        <div className="adm-card" style={{ display: "grid", gap: "0.9rem" }}>
          <div className="adm-toolbar">
            <div className="adm-search">
              <IconSearch />
              <input
                type="search"
                placeholder="Search name, phone, site, message…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search inquiries"
              />
            </div>
            <button className="btn btn--outline btn--sm" type="button" onClick={exportCsv}>
              <IconDownload /> CSV
            </button>
            {selectedVisible.length > 0 ? (
              <button
                className="btn btn--sm btn--danger"
                type="button"
                onClick={() => setConfirming(selectedVisible)}
              >
                <IconTrash /> Delete {selectedVisible.length}
              </button>
            ) : null}
            {isDemo() ? (
              <button className="btn btn--sm" type="button" onClick={() => void simulate()}>
                Simulate
              </button>
            ) : null}
          </div>

          <div className="adm-chips" role="group" aria-label="Filter by status">
            <button
              type="button"
              className="adm-chip"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All <span>{stats.total}</span>
            </button>
            <button
              type="button"
              className="adm-chip"
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread <span>{stats.unread}</span>
            </button>
            {inquiryStatuses.map((status) => (
              <button
                key={status.value}
                type="button"
                className="adm-chip"
                aria-pressed={filter === status.value}
                onClick={() => setFilter(status.value)}
              >
                {status.label} <span>{stats.byStatus[status.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <label className="adm-selectall">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAll}
              aria-label="Select all inquiries shown"
            />
            <span>
              {allVisibleSelected ? "Clear selection" : "Select all"} · {filtered.length} shown
            </span>
          </label>
        ) : null}

        {confirming ? (
          <div className="adm-confirm" role="alertdialog" aria-label="Confirm delete">
            <div>
              <strong>
                Delete {confirming.length === 1 ? "this inquiry" : `${confirming.length} inquiries`} permanently?
              </strong>
              <p>This removes {confirming.length === 1 ? "it" : "them"} from the database. It cannot be undone.</p>
            </div>
            <div className="adm-confirm__actions">
              <button className="btn btn--sm btn--danger" type="button" onClick={() => void runDelete()}>
                <IconTrash /> Yes, delete
              </button>
              <button className="btn btn--outline btn--sm" type="button" onClick={() => setConfirming(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading && inquiries.length === 0 ? (
          <div className="adm-skeleton">
            <div />
            <div />
            <div />
            <div />
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-card adm-empty">
            <IconInbox />
            <strong>Nothing here</strong>
            <p>Try a different filter or clear the search.</p>
          </div>
        ) : (
          <div className="adm-list">
            {filtered.map((inquiry) => (
              <div className="adm-row-item" key={inquiry.id}>
                <input
                  className="adm-row__check"
                  type="checkbox"
                  checked={selected.includes(inquiry.id)}
                  onChange={() => toggleOne(inquiry.id)}
                  aria-label={`Select ${inquiry.name}`}
                />
                <Link
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
                    {[inquiry.siteType, inquiry.location].filter(Boolean).join(" · ") || "No site details"}
                  </span>
                  <span className="adm-row__services">
                    {inquiry.services.slice(0, 3).map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </span>
                </span>
                <span className="adm-row__time">{relativeTime(inquiry.createdAt)}</span>
                </Link>
                <button
                  className="adm-row__del"
                  type="button"
                  title={`Delete ${inquiry.name} permanently`}
                  aria-label={`Delete ${inquiry.name} permanently`}
                  onClick={() => setConfirming([inquiry.id])}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: showDetail ? "block" : "none", minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
