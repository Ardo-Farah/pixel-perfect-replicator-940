import { createFileRoute } from "@tanstack/react-router";
import { AppShell, } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, ProgressBar, SectionCard, StatusPill } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Summary — WHO Kenya Health Surveillance" },
      { name: "description", content: "User support dashboard: system health, support tickets, and clinical service uptime for WHO Kenya." },
    ],
  }),
  component: SummaryPage,
});

const tickets = [
  { initials: "AK", initialsBg: "bg-secondary-fixed text-on-secondary-container", user: "Amara K. (Mombasa)", issue: "Mpox reporting module timeout error", priority: "URGENT", priorityVariant: "urgent" as const, status: "Open", statusDot: "bg-error animate-pulse", action: "RESOLVE" },
  { initials: "JM", initialsBg: "bg-primary-fixed text-on-primary-fixed", user: "John M. (Nairobi)", issue: "Password reset for EPR portal access", priority: "MEDIUM", priorityVariant: "medium" as const, status: "In Progress", statusDot: "bg-secondary", action: "RESOLVE" },
  { initials: "SO", initialsBg: "bg-tertiary-fixed text-on-tertiary-fixed", user: "Sarah O. (Kisumu)", issue: "IDSR Data export slow during peak hours", priority: "LOW", priorityVariant: "low" as const, status: "Resolved", statusDot: "bg-green-500", action: "Closed", actionMuted: true },
  { initials: "DO", initialsBg: "bg-secondary-fixed text-on-secondary-container", user: "David O. (Garissa)", issue: "Missing flood nutrition data for Week 24", priority: "URGENT", priorityVariant: "urgent" as const, status: "Open", statusDot: "bg-error animate-pulse", action: "RESOLVE" },
];

function SummaryPage() {
  return (
    <AppShell title="WHO Kenya Health Emergencies" subtitle="EPIDEMIOLOGICAL SITUATION REPORT">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label-caps text-secondary">USER SUPPORT DASHBOARD</p>
          <h1 className="mt-1 text-3xl font-bold text-primary">System Health & Inquiries</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          SYSTEMS STABLE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCardWithBar label="ACTIVE USERS" icon="group" iconColor="text-secondary" value="1,284" pct={85} barColor="bg-secondary" trackColor="bg-secondary-container/40" subtext="+4% vs last hour" subtextColor="text-green-600" />
        <MetricCardWithBar label="OPEN TICKETS" icon="confirmation_number" iconColor="text-error" value="12" pct={40} barColor="bg-error" trackColor="bg-surface-container-low" subtext="-2 vs yesterday" subtextColor="text-error" />
        <MetricCardWithBar label="SYSTEM UPTIME" icon="dns" iconColor="text-green-600" value="99.98%" pct={99.98} barColor="bg-green-600" trackColor="bg-green-100" subtext="Last 30 days" />
        <MetricCardWithBar label="AVG RESPONSE TIME" icon="timer" iconColor="text-primary" value="14m" pct={60} barColor="bg-primary" trackColor="bg-primary-fixed" subtext="-5m improved" subtextColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-8"
          title="Recent Support Tickets"
          action={
            <button className="rounded border border-outline-variant px-3 py-1.5 text-label-caps hover:bg-surface-container-low">
              VIEW ALL
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-outline-variant bg-surface-container-low">
                  {["User", "Issue", "Priority", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {tickets.map((t) => (
                  <tr key={t.user} className="hover:bg-surface-container">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${t.initialsBg}`}>
                          {t.initials}
                        </div>
                        <span className="text-body-md font-semibold text-on-surface">{t.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{t.issue}</td>
                    <td className="px-6 py-4">
                      <StatusPill variant={t.priorityVariant}>{t.priority}</StatusPill>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-body-md text-on-surface">
                        <span className={`h-2 w-2 rounded-full ${t.statusDot}`} />
                        {t.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-label-caps ${t.actionMuted ? "text-on-surface-variant opacity-60" : "text-primary hover:underline cursor-pointer"}`}>
                      {t.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-6 lg:col-span-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">medical_services</span>
              <h3 className="text-headline-sm text-primary">Clinical Service Health</h3>
            </div>
            <ul className="space-y-4 text-body-md">
              <li className="flex items-center justify-between">
                <span className="text-on-surface">Database Latency</span>
                <span className="font-semibold text-green-700">OK (42ms)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-on-surface">API Gateway</span>
                <span className="font-semibold text-green-700">OK (99.9%)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-on-surface">Email Notifications</span>
                <span className="font-semibold text-error">DELAYED (2m)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-on-surface">Storage Capacity</span>
                <span className="font-semibold text-on-surface-variant">74% Capacity</span>
              </li>
            </ul>
          </Card>

          <NotesCard title="Support Protocol" icon="info">
            <div className="space-y-4">
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-label-caps text-secondary">ALERT</p>
                <p className="mt-2 text-body-md text-on-surface">
                  Scheduled maintenance for IDSR module tonight 02:00 AM EAT. Notify active users 30 mins prior.
                </p>
              </div>
              <div className="border-l-4 border-secondary pl-4">
                <p className="text-body-md text-on-surface">
                  Prioritize tickets tagged with <strong>"EPR Critical"</strong> as they impact vaccine supply chain reporting.
                </p>
              </div>
            </div>
          </NotesCard>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCardWithBar({
  label, value, icon, iconColor, subtext, subtextColor = "text-on-surface-variant",
}: {
  label: string; value: string; icon: string; iconColor: string; pct?: number; barColor?: string; trackColor?: string; subtext: string; subtextColor?: string;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-label-caps text-on-surface-variant truncate">{label}</p>
        <span className={`material-symbols-outlined opacity-70 shrink-0 ${iconColor}`}>{icon}</span>
      </div>
      <p className="text-display-metric font-bold text-primary truncate">{value}</p>
      <p className={`text-metric-subtext ${subtextColor}`}>{subtext}</p>
    </Card>
  );
}
