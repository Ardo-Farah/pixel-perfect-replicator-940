import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  mockKpis,
  mockUploadsPerWeek,
  mockAudit,
  type AuditEntry,
} from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — WHO Kenya" }] }),
  component: OverviewPage,
});

const quickLinks = [
  { to: "/admin/reports",   label: "Manage Reports",   icon: "description", color: "#00205c" },
  { to: "/admin/users",     label: "Manage Users",     icon: "group",       color: "#009ADE" },
  { to: "/admin/documents", label: "Documents Library", icon: "folder",     color: "#0d7a5f" },
  { to: "/admin/logs",      label: "Logs & Analytics", icon: "analytics",   color: "#c9a84c" },
] as const;

function OverviewPage() {
  const recent = mockAudit.slice(0, 8);

  return (
    <AdminShell title="Admin Overview" subtitle="System health & activity">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon="group"       label="Total Users"       value={mockKpis.total_users}       color="#009ADE" />
        <Kpi icon="public"      label="Published Reports" value={mockKpis.published_reports} color="#00205c" />
        <Kpi icon="folder"      label="Documents Stored"  value={mockKpis.documents_stored}  color="#0d7a5f" />
        <Kpi icon="bolt"        label="Actions (7d)"      value={mockKpis.actions_last_7d}   color="#c9a84c" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-headline-sm text-primary mb-1">Uploads per week</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last 8 epidemiological weeks</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockUploadsPerWeek}>
                <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#009ADE10" }} />
                <Bar dataKey="count" fill="#009ADE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-headline-sm text-primary mb-4">Quick actions</h3>
          <div className="space-y-2">
            {quickLinks.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-3 rounded-lg border border-outline-variant px-3 py-2.5 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: `${q.color}22`, color: q.color }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{q.icon}</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">{q.label}</span>
                <span className="material-symbols-outlined ml-auto text-on-surface-variant" style={{ fontSize: 18 }}>chevron_right</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-headline-sm text-primary mb-4">Recent Activity</h3>
        <ul className="divide-y divide-outline-variant">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-on-surface">{actionLabel(r.action)}</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {r.actor_email} · {r.target}
                </p>
              </div>
              <span className="text-xs text-on-surface-variant whitespace-nowrap">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}

function Kpi({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${color}22`, color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value.toLocaleString()}</p>
        <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      </div>
    </Card>
  );
}

export function actionLabel(a: AuditEntry["action"]) {
  switch (a) {
    case "publish_report":   return "Published report";
    case "unpublish_report": return "Unpublished report";
    case "delete_report":    return "Deleted report";
    case "upload_document":  return "Uploaded document";
    case "delete_document":  return "Deleted document";
    case "grant_admin":      return "Granted admin";
    case "revoke_admin":     return "Revoked admin";
    case "delete_user":      return "Deleted user";
  }
}
