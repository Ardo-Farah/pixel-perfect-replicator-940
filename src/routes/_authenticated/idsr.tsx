import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MapPlaceholder, MetricCard, SectionCard, StatusPill } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/idsr")({
  head: () => ({
    meta: [
      { title: "IDSR Overview — WHO Kenya" },
      { name: "description", content: "Integrated Disease Surveillance and Response performance, regional reporting timeliness, and live response updates." },
    ],
  }),
  component: IdsrPage,
});

const regional = [
  { county: "Nairobi", timeliness: "92%", completeness: "98%", facilities: 142, status: "Target Met", variant: "target-met" as const, alert: false },
  { county: "Mombasa", timeliness: "85%", completeness: "91%", facilities: 58, status: "Stable", variant: "stable" as const, alert: false },
  { county: "Turkana", timeliness: "64%", completeness: "72%", facilities: 34, status: "Below Target", variant: "below-target" as const, alert: true },
  { county: "Kisumu", timeliness: "89%", completeness: "95%", facilities: 82, status: "Target Met", variant: "target-met" as const, alert: false },
  { county: "Kiambu", timeliness: "90%", completeness: "96%", facilities: 115, status: "Target Met", variant: "target-met" as const, alert: false },
];

const updates = [
  { icon: "vaccines", iconBg: "bg-secondary-fixed text-secondary", title: "Cholera Vaccination Drive Initiated", body: "Emergency response team deployed to Garissa County following localized outbreak alerts. Targeted vaccination campaign reaching 12,000 residents.", meta: "2 hours ago • Health Emergency Program" },
  { icon: "biotech", iconBg: "bg-secondary-fixed text-secondary", title: "New Lab Capacity in Kisumu", body: "KEMRI laboratory expansion completed, reducing turnaround time for Rift Valley Fever (RVF) samples from 48h to 12h.", meta: "5 hours ago • Surveillance Strengthening" },
  { icon: "warning", iconBg: "bg-error-container text-error", title: "Reporting Delay Alert - Turkana West", body: "Connectivity issues reported in Lodwar region; mobile surveillance kits being distributed to ensure data continuity.", meta: "1 day ago • Technical Support" },
  { icon: "psychology", iconBg: "bg-secondary-fixed text-secondary", title: "Quarterly Surveillance Training", body: "County Health Management Teams (CHMTs) from 47 counties have completed the Q2 IDSR refresher training.", meta: "2 days ago • Capacity Building" },
];

function IdsrPage() {
  return (
    <AppShell title="IDSR Overview" subtitle={"\n\nEPIDEMIOLOGICAL SITUATION REPORT"}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Reporting Timeliness" value="88%" icon="schedule" subtext="↗ +2.4% from last month" subtextColor="text-secondary" centered />
        <MetricCard label="Reporting Completeness" value="94%" icon="task_alt" subtext="Consistency rating: High" centered />
        <MetricCard label="Total Alerts Triggered" value="142" icon="warning" iconColor="text-error" subtext="⚠ 12 critical alerts pending" subtextColor="text-error" centered />
        <MetricCard label="Alerts Investigated" value="100%" icon="verified" subtext="All triggers fully reviewed" subtextColor="text-secondary" centered />
      </div>

      <SectionCard
        title="Regional IDSR Performance"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["County", "Timeliness %", "Completeness %", "Active Facilities", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {regional.map((r) => (
              <tr key={r.county} className="hover:bg-surface-container">
                <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{r.county}</td>
                <td className={`px-6 py-4 text-body-md font-semibold ${r.alert ? "text-error" : "text-on-surface"}`}>{r.timeliness}</td>
                <td className={`px-6 py-4 text-body-md font-semibold ${r.alert ? "text-error" : "text-on-surface"}`}>{r.completeness}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{r.facilities}</td>
                <td className="px-6 py-4"><StatusPill variant={r.variant}>{r.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-sm text-primary">Geographic Reporting Distribution</h3>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />High</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary-container" />Low</span>
            </div>
          </div>
          <MapPlaceholder
            title="Interactive Map Layer"
            body="Click counties for specific IDSR KPIs"
            height={320}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <p className="text-label-caps text-on-surface-variant">Top Reporting Region</p>
              <p className="mt-1 text-body-md font-bold text-primary">Central Highlands</p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-error-container/40 p-4">
              <p className="text-label-caps text-on-surface-variant">Gaps Identified</p>
              <p className="mt-1 text-body-md font-bold text-error">Northern Arid Zone</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-sm text-primary">IDSR Response Updates</h3>
            <StatusPill variant="live">LIVE</StatusPill>
          </div>
          <ul className="space-y-5">
            {updates.map((u) => (
              <li key={u.title} className="flex gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${u.iconBg}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{u.icon}</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{u.title}</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">{u.body}</p>
                  <p className="mt-1 text-metric-subtext text-secondary">{u.meta}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full rounded-lg bg-surface-container-high py-3 text-body-md font-semibold text-on-surface hover:bg-surface-container-highest">
            View Historical Log
          </button>
        </Card>
      </div>
    </AppShell>
  );
}
