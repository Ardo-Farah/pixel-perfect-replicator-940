import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listAdminLogs, type AdminLogRow } from "@/lib/admin-logs.functions";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Admin · Logs — WHO Kenya" }] }),
  component: LogsPage,
});

const ACTION_COLORS: Record<string, string> = {
  publish_report: "#00205c",
  unpublish_report: "#6b7280",
  delete_report: "#dc2626",
  upload_document: "#0d7a5f",
  delete_document: "#b91c1c",
  grant_admin: "#009ADE",
  revoke_admin: "#c9a84c",
  delete_user: "#7f1d1d",
};

function labelize(a: string) {
  return a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function LogsPage() {
  const fetchLogs = useServerFn(listAdminLogs);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => fetchLogs(),
  });

  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = data ?? [];

  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (!q) return true;
      return (
        r.action.toLowerCase().includes(q) ||
        (r.target_id ?? "").toLowerCase().includes(q) ||
        (r.target_type ?? "").toLowerCase().includes(q) ||
        (r.actor_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, actionFilter]);

  const actionsPerDay = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of rows) {
      const k = r.created_at.slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([day, count]) => ({
      day: day.slice(5),
      count,
    }));
  }, [rows]);

  const actionBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.action, (counts.get(r.action) ?? 0) + 1);
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: labelize(name),
      rawName: name,
      value,
      color: ACTION_COLORS[name] ?? "#6b7280",
    }));
  }, [rows]);

  return (
    <AdminShell title="System Logs & Analytics" subtitle="Audit trail of admin actions">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-headline-sm text-primary mb-1">Actions per day</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last 14 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsPerDay}>
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#009ADE10" }} />
                <Bar dataKey="count" fill="#00205c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-headline-sm text-primary mb-1">Action breakdown</h3>
          <p className="text-xs text-on-surface-variant mb-4">All-time</p>
          {actionBreakdown.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-on-surface-variant">
              No actions yet.
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {actionBreakdown.map((entry) => (
                        <Cell key={entry.rawName} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1">
                {actionBreakdown.map((b) => (
                  <li
                    key={b.rawName}
                    className="flex items-center gap-2 text-xs text-on-surface-variant"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: b.color }}
                    />
                    <span className="flex-1">{b.name}</span>
                    <span className="font-semibold text-on-surface">{b.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, target, or user…"
          className="flex-1 max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {labelize(a)}
            </option>
          ))}
        </select>
        <span className="text-xs text-on-surface-variant">
          {filtered.length} of {rows.length} entries
        </span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            Failed to load logs: {(error as Error).message}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            {rows.length === 0 ? "No audit entries yet." : "No entries match filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((r: AdminLogRow) => {
                const hasMeta =
                  r.metadata != null &&
                  typeof r.metadata === "object" &&
                  Object.keys(r.metadata as Record<string, unknown>).length > 0;
                const isOpen = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr>
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className="inline-flex items-center gap-2"
                          style={{ color: ACTION_COLORS[r.action] ?? undefined }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: ACTION_COLORS[r.action] ?? "#6b7280",
                            }}
                          />
                          {labelize(r.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {r.target_type ? (
                          <span>
                            <span className="font-medium">{r.target_type}</span>
                            {r.target_id ? (
                              <span className="ml-1 font-mono text-xs">
                                {r.target_id.slice(0, 8)}…
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {r.actor_email ?? (
                          <span className="text-on-surface-variant/60">system</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasMeta ? (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : r.id)}
                            className="text-on-surface-variant hover:text-primary"
                            aria-label="Toggle metadata"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              {isOpen ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {hasMeta && isOpen ? (
                      <tr className="bg-surface-container-low">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="overflow-auto rounded bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
                            {JSON.stringify(r.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}
