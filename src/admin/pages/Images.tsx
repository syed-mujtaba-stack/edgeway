import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteImageRow } from "@/types/db";
import { bundledImageSrc } from "@/data/site";
import { imageSlots, type ImageSlot } from "@/data/imageSlots";
import { repo } from "@/lib/repo";
import { notifyImagesUpdated } from "@/context/SiteImages";
import { relativeTime } from "@/lib/format";
import { formatBytes, processImage, type ProcessedImage } from "@/lib/imagePipeline";
import { useToasts } from "@/admin/state";
import { IconClose, IconInfo, IconRefresh, IconUpload } from "@/admin/components/icons";

type Draft = {
  slot: ImageSlot;
  file: File | null;
  alt: string;
  processed: ProcessedImage | null;
  busy: boolean;
  error: string | null;
};

export function Images() {
  const [rows, setRows] = useState<Record<string, SiteImageRow>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await repo().listImages();
      setRows(Object.fromEntries(list.map((r) => [r.slot, r])));
    } catch (e) {
      push({ tone: "error", title: "Could not load images", body: e instanceof Error ? e.message : undefined });
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (slot: ImageSlot) =>
    setDraft({ slot, file: null, alt: rows[slot.key]?.alt ?? slot.defaultAlt, processed: null, busy: false, error: null });

  const closeDrawer = () => setDraft(null);

  const pickFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    setDraft({ ...draft, busy: true, error: null, file });
    try {
      const processed = await processImage(file);
      setDraft((d) => (d ? { ...d, processed, busy: false } : d));
    } catch (e) {
      setDraft((d) =>
        d ? { ...d, busy: false, error: e instanceof Error ? e.message : "Could not read that image" } : d,
      );
    }
  };

  const save = async () => {
    if (!draft?.file || !draft.processed) return;
    setDraft({ ...draft, busy: true, error: null });
    try {
      await repo().uploadImage(draft.slot.key, draft.file, draft.alt.trim() || draft.slot.defaultAlt);
      notifyImagesUpdated();
      await load();
      setDraft(null);
      push({ tone: "ok", title: "Image updated", body: `${draft.slot.label} is live on the site.` });
    } catch (e) {
      setDraft((d) =>
        d ? { ...d, busy: false, error: e instanceof Error ? e.message : "Upload failed" } : d,
      );
    }
  };

  const reset = async (slot: ImageSlot) => {
    try {
      await repo().resetImage(slot.key);
      notifyImagesUpdated();
      await load();
      push({ tone: "ok", title: "Reset to original", body: `${slot.label} uses the bundled image again.` });
    } catch (e) {
      push({ tone: "error", title: "Could not reset", body: e instanceof Error ? e.message : undefined });
    }
  };

  const restore = async (slot: ImageSlot, versionId: string) => {
    try {
      await repo().restoreVersion(slot.key, versionId);
      notifyImagesUpdated();
      await load();
      push({ tone: "ok", title: "Version restored" });
    } catch (e) {
      push({ tone: "error", title: "Could not restore that version", body: e instanceof Error ? e.message : undefined });
    }
  };

  return (
    <>
      <div className="adm-note-banner">
        <IconInfo />
        <div>
          Every upload is converted automatically to the two sizes the site actually serves
          (1200w and 2400w WebP), so pages stay fast. Changes go live on the next page load — no
          deploy needed.
        </div>
      </div>

      {loading ? (
        <div className="adm-skeleton">
          <div />
          <div />
        </div>
      ) : (
        <div className="adm-slots">
          {imageSlots.map((slot) => {
            const row = rows[slot.key];
            const custom = Boolean(row?.src2400);
            const src = row?.src1200 ?? row?.src2400 ?? bundledImageSrc(slot.default);
            const contain = slot.default.widths.length === 1 || undefined;
            return (
              <article className="adm-slot" key={slot.key}>
                <div className="adm-slot__media" data-contain={contain}>
                  <img src={src} alt="" loading="lazy" />
                  <span className="adm-slot__tag" data-custom={custom}>
                    {custom ? "Custom" : "Default"}
                  </span>
                </div>
                <div className="adm-slot__body">
                  <h3>{slot.label}</h3>
                  <p>{slot.hint}</p>
                  <p style={{ fontSize: "0.6875rem" }}>
                    {custom
                      ? `Updated ${relativeTime(row!.updatedAt)}${row?.updatedBy ? ` by ${row.updatedBy}` : ""} · v${row?.version}`
                      : "Bundled original"}
                  </p>
                  <div className="adm-slot__actions">
                    <button className="adm-slot__btn adm-slot__btn--primary" type="button" onClick={() => open(slot)}>
                      <IconUpload /> Replace
                    </button>
                    {custom ? (
                      <button className="adm-slot__btn" type="button" onClick={() => void reset(slot)}>
                        <IconRefresh /> Reset
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {draft ? (
        <div className="adm-drawer-backdrop" onClick={closeDrawer} role="presentation">
          <div
            className="adm-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Replace ${draft.slot.label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-drawer__head">
              <h2>{draft.slot.label}</h2>
              <button className="adm-drawer__close" type="button" onClick={closeDrawer} aria-label="Close">
                <IconClose />
              </button>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-3)" }}>{draft.slot.hint}</p>

            <div
              className="adm-drop"
              data-over={over}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                void pickFile(e.dataTransfer.files?.[0]);
              }}
            >
              <IconUpload />
              <strong style={{ fontSize: "0.9375rem" }}>Drop an image here</strong>
              <p>JPG, PNG, WebP or AVIF · up to 12 MB</p>
              <button className="btn btn--outline btn--sm" type="button" onClick={() => inputRef.current?.click()}>
                Choose file
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void pickFile(e.target.files?.[0] ?? undefined)}
              />
            </div>

            {draft.error ? <p style={{ color: "#8f1d15", fontSize: "0.875rem" }}>{draft.error}</p> : null}

            {draft.processed ? (
              <div className="adm-preview">
                <img src={draft.processed.previewUrl} alt="Preview of the new image" />
                <p style={{ fontSize: "0.75rem", color: "var(--ink-3)" }}>
                  {draft.processed.width} × {draft.processed.height} · {formatBytes(draft.file?.size ?? 0)} in →{" "}
                  {formatBytes(draft.processed.full.size)} + {formatBytes(draft.processed.small.size)} WebP out
                </p>
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="slot-alt">Alt text (describes the image for screen readers and SEO)</label>
              <input
                id="slot-alt"
                value={draft.alt}
                onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
                placeholder="Security officer on night patrol"
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="btn"
                type="button"
                disabled={!draft.processed || draft.busy}
                onClick={() => void save()}
              >
                {draft.busy ? "Saving…" : "Save & publish"}
              </button>
              <button className="btn btn--outline" type="button" onClick={closeDrawer}>
                Cancel
              </button>
            </div>

            {rows[draft.slot.key]?.history.length ? (
              <details className="adm-accordion">
                <summary>Previous versions ({rows[draft.slot.key].history.length})</summary>
                <div className="adm-list" style={{ marginTop: "0.5rem" }}>
                  {rows[draft.slot.key].history.map((version) => (
                    <div className="adm-device" key={version.id}>
                      <div className="adm-device__meta">
                        <strong>{version.alt || "Untitled"}</strong>
                        <span>
                          {version.createdBy} · {relativeTime(version.createdAt)}
                        </span>
                      </div>
                      <button
                        className="btn btn--outline btn--sm"
                        type="button"
                        onClick={() => void restore(draft.slot, version.id)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
