import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import { mockDocuments, type AdminDocument } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Admin · Documents — WHO Kenya" }] }),
  component: DocumentsPage,
});

type TypeFilter = "all" | "pptx" | "pdf" | "xlsx";

const typeStyles: Record<AdminDocument["file_type"], { bg: string; color: string; icon: string }> = {
  pptx: { bg: "#c4654a22", color: "#c4654a", icon: "slideshow" },
  pdf:  { bg: "#c4456922", color: "#c44569", icon: "picture_as_pdf" },
  xlsx: { bg: "#0d7a5f22", color: "#0d7a5f", icon: "table_chart" },
};

function DocumentsPage() {
  const [docs, setDocs] = useState<AdminDocument[]>(mockDocuments);
  const [filter, setFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(
    () => docs.filter((d) => filter === "all" || d.file_type === filter),
    [docs, filter],
  );

  const download = (d: AdminDocument) => {
    toast.info(`Mock download: ${d.name}`, "Backend wiring comes in the next phase.");
  };

  const remove = (id: string) => {
    if (!confirm("Delete this document? (mock — nothing is actually removed yet)")) return;
    setDocs((ds) => ds.filter((d) => d.id !== id));
    toast.success("Mock action — backend wiring next phase");
  };

  return (
    <AdminShell title="Documents Library" subtitle="All approved files available to users">
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-outline-variant overflow-hidden">
          {(["all", "pptx", "pdf", "xlsx"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 text-xs font-semibold uppercase ${
                filter === t ? "bg-[#009ADE] text-white" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant">{filtered.length} files</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">No documents match the filter.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => {
            const s = typeStyles[d.file_type];
            return (
              <Card key={d.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: s.bg, color: s.color }}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface break-words leading-tight">{d.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Week {d.week_number} · {fmtSize(d.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant">
                  <p>{d.uploader_email}</p>
                  <p>{new Date(d.uploaded_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => download(d)}
                    className="flex-1 rounded-md border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => remove(d.id)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
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
