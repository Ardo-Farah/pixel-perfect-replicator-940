import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { supabase } from "@/lib/supabase";
import { useUpload } from "@/context/UploadProvider";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/_admin/reports")({
  head: () => ({ meta: [{ title: "Admin · Reports — WHO Kenya" }] }),
  component: ReportsPage,
});

type Report = {
  id: string;
  week_number: number;
  reporting_date: string | null;
  published: boolean;
  created_at: string;
};

function ReportsPage() {
  const [rows, setRows] = useState<Report[] | null>(null);
  const { status } = useUpload();
  const lastStatus = useRef(status);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("weekly_reports" as never)
      .select("id, week_number, reporting_date, published, created_at")
      .order("week_number", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data as Report[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reload after a successful upload.
  useEffect(() => {
    if (lastStatus.current !== "success" && status === "success") load();
    lastStatus.current = status;
  }, [status, load]);

  const togglePublish = async (r: Report) => {
    const { error } = await supabase
      .from("weekly_reports" as never)
      .update({ published: !r.published })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    await logAction(r.published ? "unpublish_report" : "publish_report", "weekly_report", r.id);
    toast.success(r.published ? "Unpublished" : "Published");
    load();
  };

  const remove = async (r: Report) => {
    if (!confirm(`Delete Week ${r.week_number}? This removes all related data.`)) return;
    const { error } = await supabase.from("weekly_reports" as never).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await logAction("delete_report", "weekly_report", r.id, { week_number: r.week_number });
    toast.success("Report deleted");
    load();
  };

  return (
    <AdminShell title="Reports Management" subtitle="Upload, publish, delete weekly reports" showUpload>
      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-on-surface-variant">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            No reports uploaded yet. Click "Upload Report" above to add one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Reporting Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">Week {r.week_number}</td>
                  <td className="px-4 py-3">{r.reporting_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {r.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => togglePublish(r)}
                      className="rounded-md border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low"
                    >
                      {r.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
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

async function logAction(action: string, target_type: string, target_id: string, metadata?: Record<string, unknown>) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  await supabase.from("audit_log" as never).insert({
    user_id: uid, action, target_type, target_id, metadata: metadata ?? null,
  });
}
