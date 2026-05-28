import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import {
  listAdminReports,
  setReportPublished,
  deleteAdminReport,
  type AdminReportRow,
} from "@/lib/admin-reports.functions";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Admin · Reports — WHO Kenya" }] }),
  component: ReportsPage,
});

type Filter = "all" | "published" | "draft";

function ReportsPage() {
  const qc = useQueryClient();
  const fetchReports = useServerFn(listAdminReports);
  const publishFn = useServerFn(setReportPublished);
  const deleteFn = useServerFn(deleteAdminReport);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => fetchReports(),
  });

  const publish = useMutation({
    mutationFn: (vars: { id: string; published: boolean }) =>
      publishFn({ data: vars }),
    onSuccess: (_, vars) => {
      toast.success(vars.published ? "Report published" : "Report unpublished");
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (e: Error) => toast.error("Failed", e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (e: Error) => toast.error("Failed", e.message),
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows: AdminReportRow[] = data ?? [];
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "published" && !r.published) return false;
      if (filter === "draft" && r.published) return false;
      if (search) {
        const hay = `week ${r.week_number} ${r.uploader_email ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, search, filter]);

  return (
    <AdminShell title="Reports Management" subtitle="Publish or delete weekly reports">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search week or uploader…"
          className="flex-1 min-w-[200px] max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <div className="flex rounded-lg border border-outline-variant overflow-hidden">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-semibold capitalize ${
                filter === f ? "bg-[#009ADE] text-white" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading reports…</div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            {(error as Error).message || "Failed to load reports"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            {rows.length === 0 ? "No reports uploaded yet." : "No reports match the filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Reporting date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded by</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">Week {r.week_number}</td>
                  <td className="px-4 py-3">{r.reporting_date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {r.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{r.uploaded_by ?? "—"}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      disabled={publish.isPending}
                      onClick={() => publish.mutate({ id: r.id, published: !r.published })}
                      className="rounded-md border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low disabled:opacity-50"
                    >
                      {r.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      disabled={remove.isPending}
                      onClick={() => {
                        if (confirm(`Delete Week ${r.week_number}? This cannot be undone.`)) {
                          remove.mutate(r.id);
                        }
                      }}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}
