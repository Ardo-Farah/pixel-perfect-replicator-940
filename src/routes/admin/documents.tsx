import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import { useUpload } from "@/context/UploadProvider";
import {
  listAdminDocuments,
  createDocumentUploadUrl,
  finalizeDocumentUpload,
  getDocumentDownloadUrl,
  deleteAdminDocument,
  setDocumentReport,
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
  const linkReport = setDocumentReport;

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
      const result = await startUpload(file);
      // Link this library document to the report it produced so the selector
      // resolves it directly next time.
      if (result?.report_id) {
        await linkReport({ data: { storage_path: d.storage_path, report_id: result.report_id } });
        invalidate();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not read document");
    } finally {
      setReading(null);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    e.target.value = "";
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

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
