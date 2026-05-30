import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import {
  listAdminDocuments,
  createDocumentUploadUrl,
  finalizeDocumentUpload,
  getDocumentDownloadUrl,
  deleteAdminDocument,
  type AdminDocumentRow,
} from "@/lib/admin-documents.functions";

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
  const list = useServerFn(listAdminDocuments);
  const createUrl = useServerFn(createDocumentUploadUrl);
  const finalize = useServerFn(finalizeDocumentUpload);
  const getDownload = useServerFn(getDocumentDownloadUrl);
  const del = useServerFn(deleteAdminDocument);

  const [filter, setFilter] = useState<TypeFilter>("all");
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-documents"] });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const { bucket, storage_path, token, file_type } = await createUrl({
        data: { name: file.name, size_bytes: file.size },
      });
      const uploadUrl =
        `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/upload/sign/` +
        `${bucket}/${storage_path}?token=${encodeURIComponent(token)}`;
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: file,
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
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => handleDownload(d.storage_path)}
                    className="flex-1 rounded-md border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                  >
                    Download
                  </button>
                  <button
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${d.name}"? This cannot be undone.`)) {
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
