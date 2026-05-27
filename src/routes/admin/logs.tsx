import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Admin · Logs — WHO Kenya" }] }),
  component: LogsPage,
});

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function LogsPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("audit_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows(((data as AuditRow[]) ?? []));
    })();
  }, []);

  const filtered = (rows ?? []).filter((r) =>
    !filter || r.action.toLowerCase().includes(filter.toLowerCase()) ||
    (r.target_type ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AdminShell title="System Logs & Analytics" subtitle="Audit trail of admin actions">
      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action or target type…"
          className="flex-1 max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <span className="text-xs text-on-surface-variant">{filtered.length} entries</span>
      </div>
      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-8 text-center text-on-surface-variant">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            {rows.length === 0 ? "No actions logged yet." : "No entries match filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">{r.action}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {r.target_type ?? "—"} {r.target_id ? `· ${r.target_id.slice(0, 12)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">
                    {r.user_id ? `${r.user_id.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(r.created_at).toLocaleString()}
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
