import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdmin, useToasts } from "@/admin/state";
import { fullDate, relativeTime } from "@/lib/format";
import { inquiryStatuses, type InquiryStatus } from "@/types/db";
import { StatusPill } from "@/admin/components/StatusPill";
import {
  IconArrowLeft,
  IconCopy,
  IconMail,
  IconPhone,
  IconTrash,
} from "@/admin/components/icons";

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const { inquiries, markRead, setStatus, addNote, remove } = useAdmin();
  const { push } = useToasts();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  const inquiry = inquiries.find((i) => i.id === id);

  useEffect(() => {
    if (inquiry && !inquiry.isRead) void markRead(inquiry.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.id]);

  if (!inquiry) {
    return (
      <div className="adm-card adm-empty">
        <strong>Inquiry not found</strong>
        <p>It may have been deleted.</p>
        <Link className="btn btn--sm" to="/admin/inquiries">
          Back to inbox
        </Link>
      </div>
    );
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      push({ tone: "ok", title: `${label} copied` });
    } catch {
      push({ tone: "error", title: "Could not copy" });
    }
  };

  return (
    <div className="adm-detail">
      <div className="adm-card" style={{ display: "grid", gap: "0.75rem" }}>
        <div className="adm-detail__head">
          <Link
            className="btn btn--outline btn--sm"
            to="/admin/inquiries"
            style={{ display: "inline-flex" }}
          >
            <IconArrowLeft /> Back
          </Link>
          <div style={{ minWidth: 0 }}>
            <h2>{inquiry.name}</h2>
            <p>
              {inquiry.company ? `${inquiry.company} · ` : ""}
              {fullDate(inquiry.createdAt)} · {relativeTime(inquiry.createdAt)}
            </p>
          </div>
          <div className="adm-detail__actions">
            <StatusPill status={inquiry.status} />
            <select
              className="adm-select"
              aria-label="Status"
              value={inquiry.status}
              onChange={(e) => void setStatus(inquiry.id, e.target.value as InquiryStatus)}
            >
              {inquiryStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <a className="btn btn--sm" href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}>
            <IconPhone /> Call
          </a>
          <a className="btn btn--outline btn--sm" href={waLink(inquiry.phone)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="btn btn--outline btn--sm" href={`mailto:${inquiry.email}`}>
            <IconMail /> Email
          </a>
          <button
            className="btn btn--outline btn--sm"
            type="button"
            onClick={() => void copy(inquiry.phone, "Phone number")}
          >
            <IconCopy /> Phone
          </button>
        </div>

        <dl className="adm-facts">
          <div className="adm-fact">
            <dt>Phone</dt>
            <dd className="adm-fact__value">
              <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}>{inquiry.phone}</a>
            </dd>
          </div>
          <div className="adm-fact">
            <dt>Email</dt>
            <dd className="adm-fact__value">
              <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
            </dd>
          </div>
          <div className="adm-fact">
            <dt>Services</dt>
            <dd className="adm-fact__value">{inquiry.services.join(", ") || "Not specified"}</dd>
          </div>
          <div className="adm-fact">
            <dt>Site type</dt>
            <dd className="adm-fact__value">{inquiry.siteType ?? "Not specified"}</dd>
          </div>
          <div className="adm-fact">
            <dt>Location</dt>
            <dd className="adm-fact__value">{inquiry.location ?? "Not specified"}</dd>
          </div>
          <div className="adm-fact">
            <dt>Needed</dt>
            <dd className="adm-fact__value">{inquiry.timing ?? "Not specified"}</dd>
          </div>
          <div className="adm-fact">
            <dt>Source</dt>
            <dd className="adm-fact__value">{inquiry.source}</dd>
          </div>
        </dl>

        {inquiry.message ? <p className="adm-message">{inquiry.message}</p> : null}
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Notes</h2>
        </div>
        {inquiry.notes.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--ink-3)" }}>
            No notes yet. Log what you agreed on so the next call has context.
          </p>
        ) : (
          <div className="adm-notes">
            {inquiry.notes.map((n) => (
              <div className="adm-note" key={n.id}>
                {n.body}
                <time>
                  {n.author} · {relativeTime(n.createdAt)}
                </time>
              </div>
            ))}
          </div>
        )}
        <form
          className="adm-note-form"
          onSubmit={(e) => {
            e.preventDefault();
            void addNote(inquiry.id, note);
            setNote("");
          }}
        >
          <textarea
            placeholder="Called at 4pm, sending a quote for 2 posts…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Add a note"
          />
          <button className="btn btn--sm" type="submit" disabled={!note.trim()}>
            Add note
          </button>
        </form>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2>Danger zone</h2>
        </div>
        {confirming ? (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="btn btn--sm"
              type="button"
              style={{ background: "#8f1d15" }}
              onClick={() => {
                void remove(inquiry.id);
                navigate("/admin/inquiries");
              }}
            >
              Yes, delete permanently
            </button>
            <button className="btn btn--outline btn--sm" type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn--outline btn--sm" type="button" onClick={() => setConfirming(true)}>
            <IconTrash /> Delete this inquiry
          </button>
        )}
      </div>
    </div>
  );
}
