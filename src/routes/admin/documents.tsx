import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import { useUpload } from "@/context/UploadProvider";
import { validateDocumentLibraryFile } from "@/lib/upload-validation";
import {
  listAdminDocuments,
  createDocumentUploadUrl,
  finalizeDocumentUpload,
  getDocumentDownloadUrl,
  deleteAdminDocument,
  updateReportReviewValues,
  publishDocumentReport,
  type AdminDocumentRow,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Admin · Documents — WHO Kenya" }] }),
  component: DocumentsPage,
});

type TypeFilter = "all" | "pptx" | "pdf" | "xlsx" | "other";

const typeStyles: Record<string, { bg: string; color: string; icon: string }> = {
  pptx: { bg: "#c4654a22", color: "#c4654a", icon: "slideshow" },
  pdf: { bg: "#c4456922", color: "#c44569", icon: "picture_as_pdf" },
  xlsx: { bg: "#0d7a5f22", color: "#0d7a5f", icon: "table_chart" },
  docx: { bg: "#2d8a9e22", color: "#2d8a9e", icon: "description" },
  other: { bg: "#71809622", color: "#718096", icon: "draft" },
};

function DocumentsPage() {
  const qc = useQueryClient();
  const list = listAdminDocuments;
  const createUrl = createDocumentUploadUrl;
  const finalize = finalizeDocumentUpload;
  const getDownload = getDocumentDownloadUrl;
  const del = deleteAdminDocument;

  const [filter, setFilter] = useState<TypeFilter>("all");
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => list(),
  });

  // Deleting a document cascade-deletes its linked weekly_report, so refresh
  // not just the documents grid but every cache that lists/keys off reports —
  // most visibly the week-selector dropdown (["weekly-reports"]).
  const invalidate = () => {
    for (const key of [
      ["admin-documents"],
      ["documents-selector"],
      ["weekly-reports"],
      ["latest-report"],
      ["table-data"],
      ["county-data"],
      ["report-visuals"],
      ["admin", "reports"],
    ]) {
      qc.invalidateQueries({ queryKey: key });
    }
  };

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const validation = validateDocumentLibraryFile(file);
      if (!validation.ok) throw new Error(validation.error.message);
      const { storage_path, upload_url, file_type } = await createUrl({
        data: { name: file.name, size_bytes: file.size },
      });
      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", file);
      const res = await fetch(upload_url, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`Upload failed (${res.status}): ${msg}`);
      }
      await finalize({
        data: {
          name: file.name,
          file_type,
          size_bytes: file.size,
          storage_path,
        },
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (storage_path: string) => del({ data: { storage_path } }),
    onSuccess: () => {
      toast.success("Document deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const filtered = useMemo(
    () =>
      docs.filter((d: AdminDocumentRow) => {
        if (filter === "all") return true;
        if (filter === "other") return !["pptx", "pdf", "xlsx"].includes(d.file_type);
        return d.file_type === filter;
      }),
    [docs, filter],
  );

  const handleDownload = async (storage_path: string) => {
    try {
      const { url } = await getDownload({ data: { storage_path } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Download failed");
    }
  };

  // Run an already-stored document through the same extraction pipeline as the
  // "Upload Report" button, so its data is read into the dashboard.
  const { startUpload, status } = useUpload();
  const [reading, setReading] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [readSummary, setReadSummary] = useState<{
    name: string;
    report_id: string | null;
    storage_path: string;
    week_number: number | null;
    tables_written: string[];
    warnings: string[];
    preview?: Record<string, Record<string, number | null>>;
    evidence_summary?: {
      rows: number;
      candidate_fields?: number;
      grounded_fields?: number;
      coverage_pct?: number | null;
      by_source_type: Record<string, number>;
      headline_fields: Array<{
        field_path: string;
        value_text: string;
        source_type: string;
        slide_number: number | null;
        source_snippet: string;
        confidence: number;
      }>;
    };
  } | null>(null);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [editingFigures, setEditingFigures] = useState(false);
  const [reviewValues, setReviewValues] = useState<Record<string, Record<string, string>>>({});
  const [reviewValuesDirty, setReviewValuesDirty] = useState(false);
  const lastStatus = useRef(status);

  useEffect(() => {
    if (lastStatus.current !== "success" && status === "success") {
      for (const key of [
        ["weekly-reports"],
        ["latest-report"],
        ["table-data"],
        ["county-data"],
        ["report-visuals"],
        ["admin", "reports"],
      ]) {
        qc.invalidateQueries({ queryKey: key });
      }
    }
    lastStatus.current = status;
  }, [status, qc]);

  const readIntoDashboard = async (d: AdminDocumentRow) => {
    try {
      setReading(d.storage_path);
      const { url } = await getDownload({ data: { storage_path: d.storage_path } });
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Could not fetch the stored file");
      const blob = await resp.blob();
      const file = new File([blob], d.name, { type: blob.type || "application/octet-stream" });
      const result = await startUpload(file, { storagePath: d.storage_path });
      if (result) {
        setReviewAcknowledged(false);
        setEditingFigures(false);
        setReviewValues(previewToReviewValues(result.preview));
        setReviewValuesDirty(false);
        // Review gate: the report is a DRAFT. Do NOT link the document yet —
        // linking is what makes the data visible to users, so it happens only
        // when the admin clicks Publish after checking the figures.
        setReadSummary({
          name: d.name,
          report_id: result.report_id,
          storage_path: d.storage_path,
          week_number: result.week_number,
          tables_written: result.tables_written ?? [],
          warnings: result.warnings ?? [],
          preview: result.preview,
          evidence_summary: result.evidence_summary,
        });
        qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not read document");
    } finally {
      setReading(null);
    }
  };

  // Confirm a reviewed draft: publish the report AND link the document so the
  // selector resolves it — only now does the data become visible to users.
  const publishReadIn = async () => {
    if (!readSummary?.report_id) return;
    if (requiresReviewAcknowledgement(readSummary) && !reviewAcknowledged) {
      toast.error("Confirm the review checklist before publishing this draft.");
      return;
    }
    if (hasInvalidReviewValues(reviewValues)) {
      toast.error("Some edited figures are not valid numbers.");
      return;
    }
    try {
      setPublishing(true);
      if (reviewValuesDirty) {
        await updateReportReviewValues({
          data: { report_id: readSummary.report_id, values: reviewValuesToPayload(reviewValues) },
        });
      }
      await publishDocumentReport({ data: { storage_path: readSummary.storage_path, report_id: readSummary.report_id } });
      toast.success(reviewValuesDirty ? "Saved edits and published to the dashboard" : "Published to the dashboard");
      setReadSummary(null);
      setReviewAcknowledged(false);
      setEditingFigures(false);
      setReviewValues({});
      setReviewValuesDirty(false);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    e.target.value = "";
  };

  const updateReviewValue = (page: string, field: string, value: string) => {
    setReviewValues((current) => ({
      ...current,
      [page]: {
        ...(current[page] ?? {}),
        [field]: value,
      },
    }));
    setReadSummary((current) => {
      if (!current?.preview) return current;
      return {
        ...current,
        preview: {
          ...current.preview,
          [page]: {
            ...(current.preview[page] ?? {}),
            [field]: value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value),
          },
        },
      };
    });
    setReviewValuesDirty(true);
    setReviewAcknowledged(false);
  };

  return (
    <AdminShell title="Documents Library" subtitle="All approved files available to users">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-outline-variant overflow-hidden">
          {(["all", "pptx", "pdf", "xlsx", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 text-xs font-semibold uppercase ${
                filter === t
                  ? "bg-[#009ADE] text-white"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant">
          {isLoading ? "Loading…" : `${filtered.length} files`}
        </span>
        <div className="ml-auto">
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            onChange={onPickFile}
            accept=".pptx,.pdf,.xlsx,.docx"
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploadMut.isPending}
            className="rounded-md bg-[#009ADE] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploadMut.isPending ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </div>

      {readSummary ? (
        <Card className="border-l-4 border-l-[#009ADE] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface">
                Review draft
                {readSummary.week_number != null ? ` · Week ${readSummary.week_number}` : ""}
              </p>
              <p className="mt-0.5 truncate text-xs text-on-surface-variant">{readSummary.name}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-amber-700">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility_off</span>
                Draft — not visible to users until you publish. Check the figures against the source.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={publishReadIn}
                disabled={
                  publishing ||
                  !readSummary.report_id ||
                  (requiresReviewAcknowledgement(readSummary) && !reviewAcknowledged) ||
                  hasInvalidReviewValues(reviewValues)
                }
                className="rounded-md bg-[#009ADE] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish to dashboard"}
              </button>
              <button
                onClick={() => {
                  setReadSummary(null);
                  setReviewAcknowledged(false);
                  setEditingFigures(false);
                  setReviewValues({});
                  setReviewValuesDirty(false);
                }}
                aria-label="Dismiss (keep as draft)"
                title="Dismiss (stays a draft — publish later from Admin → Reports)"
                className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          </div>

          {readSummary.preview ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Extracted figures</p>
                  {reviewValuesDirty ? (
                    <p className="mt-0.5 text-[11px] font-medium text-[#0077A8]">
                      Edited values will be saved to the draft before publishing.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingFigures((v) => !v)}
                  className="rounded-md border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                >
                  {editingFigures ? "Done editing" : "Edit figures"}
                </button>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(readSummary.preview)
                  .filter(([, fields]) => Object.values(fields).some((v) => v != null))
                  .map(([page, fields]) => (
                    <div key={page} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{prettyPage(page)}</p>
                      <dl className="mt-1.5 space-y-0.5">
                        {Object.entries(fields).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-2 text-[12px]">
                            <dt className="text-on-surface-variant">{prettyField(k)}</dt>
                            {editingFigures && isEditablePreviewField(page, k) ? (
                              <input
                                type="number"
                                step={k === "cfr" ? "0.1" : "1"}
                                value={reviewValues[page]?.[k] ?? ""}
                                onChange={(e) => updateReviewValue(page, k, e.target.value)}
                                className="h-7 w-24 rounded-md border border-outline-variant bg-surface px-2 text-right text-xs font-semibold"
                                aria-label={`${prettyPage(page)} ${prettyField(k)}`}
                              />
                            ) : null}
                            <dd className="font-semibold text-on-surface">{v == null ? "—" : v.toLocaleString()}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {readSummary.evidence_summary ? (
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Source evidence
                  </p>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    {readSummary.evidence_summary.rows.toLocaleString()} extracted values linked to source text.
                    {typeof readSummary.evidence_summary.coverage_pct === "number" ? (
                      <>
                        {" "}
                        Coverage: {readSummary.evidence_summary.coverage_pct}% ({readSummary.evidence_summary.grounded_fields ?? 0}/
                        {readSummary.evidence_summary.candidate_fields ?? 0} fields).
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(readSummary.evidence_summary.by_source_type).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>
              {readSummary.evidence_summary.headline_fields.length > 0 ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {readSummary.evidence_summary.headline_fields.slice(0, 6).map((ev) => (
                    <div key={`${ev.field_path}-${ev.value_text}-${ev.slide_number ?? "na"}`} className="rounded-md border border-outline-variant bg-surface px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-on-surface">{prettyFieldPath(ev.field_path)} = {ev.value_text}</span>
                        <span className="shrink-0 text-on-surface-variant">
                          {ev.slide_number ? `Slide ${ev.slide_number}` : ev.source_type}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
                        {ev.source_snippet}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {readSummary.warnings.length > 0 ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-700">
                Check these ({readSummary.warnings.length})
              </p>
              <ul className="mt-1.5 space-y-1">
                {readSummary.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: 14 }}>warning</span>
                    <span className="min-w-0 break-words">{w}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 inline-flex items-center gap-1 text-[12px] text-green-700">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
              No warnings — figures were verified against the source and any ungrounded numbers were dropped.
            </p>
          )}

          {requiresReviewAcknowledgement(readSummary) ? (
            <label className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
              <input
                type="checkbox"
                checked={reviewAcknowledged}
                onChange={(e) => setReviewAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 accent-[#009ADE]"
              />
              <span>
                I have checked the extracted figures, source evidence, coverage, and warnings against the uploaded document.
                Publishing will make this report visible to dashboard users.
              </span>
            </label>
          ) : null}

          <p className="mt-4 text-[11px] uppercase tracking-wider text-on-surface-variant">
            Tables captured ({readSummary.tables_written.length})
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {readSummary.tables_written.length === 0 ? (
              <span className="text-xs text-on-surface-variant">No tables written.</span>
            ) : (
              readSummary.tables_written.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                  {t}
                </span>
              ))
            )}
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="p-8 text-center text-on-surface-variant">Loading documents…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">
          No documents yet. Upload one to get started.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d: AdminDocumentRow) => {
            const s = typeStyles[d.file_type] ?? typeStyles.other;
            return (
              <Card key={d.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ background: s.bg, color: s.color }}
                  >
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface break-words leading-tight">
                      {d.name}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {d.week_number != null ? `Week ${d.week_number} · ` : ""}
                      {fmtSize(d.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant">
                  <p>{d.uploader_email ?? "—"}</p>
                  <p>{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  {d.report_id ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check_circle</span>
                      Read into dashboard
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                      Not read yet
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {["pptx", "pdf", "xlsx", "xls"].includes(d.file_type) ? (
                    <button
                      disabled={reading !== null}
                      onClick={() => readIntoDashboard(d)}
                      title={d.report_id ? "Re-extract this file's data into the dashboard" : "Extract this file's data into the dashboard"}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                        d.report_id
                          ? "border border-outline-variant hover:bg-surface-container-low"
                          : "bg-[#009ADE] text-white hover:opacity-90"
                      }`}
                    >
                      {reading === d.storage_path ? "Reading…" : d.report_id ? "Re-read" : "Read into dashboard"}
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleDownload(d.storage_path)}
                    className="flex-1 rounded-md border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                  >
                    Download
                  </button>
                  <button
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      const wk = d.week_number != null ? `Week ${d.week_number}` : "the linked weekly report";
                      if (
                        confirm(
                          `Delete "${d.name}"?\n\nThis will also remove ${wk} from the dashboard, including all disease data for that week. This cannot be undone.`,
                        )
                      ) {
                        deleteMut.mutate(d.storage_path);
                      }
                    }}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

const EDITABLE_PREVIEW_FIELDS: Record<string, string[]> = {
  report_summary: ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"],
  mpox: ["cumulative_cases", "new_cases_this_week", "deaths", "cfr", "counties_affected"],
  measles: ["total_cases", "confirmed", "suspected", "counties_affected"],
};

function isEditablePreviewField(page: string, field: string) {
  return EDITABLE_PREVIEW_FIELDS[page]?.includes(field) ?? false;
}

function previewToReviewValues(preview?: Record<string, Record<string, number | null>>) {
  const values: Record<string, Record<string, string>> = {};
  if (!preview) return values;
  for (const [page, fields] of Object.entries(preview)) {
    for (const [field, value] of Object.entries(fields)) {
      if (!isEditablePreviewField(page, field)) continue;
      values[page] = values[page] ?? {};
      values[page][field] = value == null ? "" : String(value);
    }
  }
  return values;
}

function hasInvalidReviewValues(values: Record<string, Record<string, string>>) {
  for (const fields of Object.values(values)) {
    for (const value of Object.values(fields)) {
      if (value.trim() !== "" && !Number.isFinite(Number(value))) return true;
    }
  }
  return false;
}

function reviewValuesToPayload(values: Record<string, Record<string, string>>) {
  const out: Record<string, Record<string, number | null>> = {};
  for (const [page, fields] of Object.entries(values)) {
    for (const [field, raw] of Object.entries(fields)) {
      if (!isEditablePreviewField(page, field)) continue;
      out[page] = out[page] ?? {};
      out[page][field] = raw.trim() === "" ? null : Number(raw);
    }
  }
  return out;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const PAGE_LABELS: Record<string, string> = { report_summary: "Summary", mpox: "Mpox", measles: "Measles", ebola: "Ebola", cholera: "Cholera", dengue: "Dengue" };
function prettyPage(key: string) {
  return PAGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
function prettyField(key: string) {
  return key.replace(/_/g, " ").replace(/\bpct\b/, "%").replace(/^\w/, (c) => c.toUpperCase());
}

function prettyFieldPath(path: string) {
  return path
    .replace(/\[\d+\]/g, "")
    .split(".")
    .map(prettyField)
    .join(" / ");
}

function requiresReviewAcknowledgement(summary: {
  warnings: string[];
  evidence_summary?: { coverage_pct?: number | null; candidate_fields?: number; grounded_fields?: number };
}) {
  const coverage = summary.evidence_summary?.coverage_pct;
  const candidates = summary.evidence_summary?.candidate_fields ?? 0;
  const grounded = summary.evidence_summary?.grounded_fields ?? 0;
  return (
    summary.warnings.length > 0 ||
    (typeof coverage === "number" && candidates >= 4 && coverage < 75) ||
    (candidates > 0 && grounded === 0)
  );
}
