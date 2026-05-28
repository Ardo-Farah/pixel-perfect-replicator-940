import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  mockAudit,
  mockActionsPerDay,
  mockActionBreakdown,
} from "@/lib/admin-mock-data";
import { actionLabel } from "@/routes/admin/index";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Admin · Logs — WHO Kenya" }] }),
  component: LogsPage,
});

function LogsPage() {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return mockAudit;
    const q = filter.toLowerCase();
    return mockAudit.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.actor_email.toLowerCase().includes(q),
    );
  }, [filter]);

  return (
    <AdminShell title="System Logs & Analytics" subtitle="Audit trail of admin actions">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-headline-sm text-primary mb-1">Actions per day</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last 14 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockActionsPerDay}>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockActionBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {mockActionBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1">
            {mockActionBreakdown.map((b) => (
              <li key={b.name} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                <span className="flex-1">{b.name}</span>
                <span className="font-semibold text-on-surface">{b.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, target, or user…"
          className="flex-1 max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <span className="text-xs text-on-surface-variant">{filtered.length} entries</span>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No entries match filter.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">{actionLabel(r.action)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{r.target}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{r.actor_email}</td>
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
