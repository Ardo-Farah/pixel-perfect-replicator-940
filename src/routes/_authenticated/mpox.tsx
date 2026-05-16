import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, MapPlaceholder, SectionCard, StatusPill } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/mpox")({
  head: () => ({
    meta: [
      { title: "Mpox Surveillance — WHO Kenya" },
      { name: "description", content: "Weekly Mpox surveillance metrics, lab capacity, and clinical response notes for Kenya." },
    ],
  }),
  component: MpoxPage,
});

const otherMetrics = [
  { name: "Home-Based Care", value: "88", status: "STABLE", variant: "stable" as const },
  { name: "Total Samples Tested", value: "2,836", status: "PROCESSING", variant: "info" as const },
  { name: "Positive / Negative Tests", value: "1,123 / 1,712", status: "VERIFIED", variant: "info" as const },
  { name: "Pending Results", value: "0", status: "CLEARED", variant: "success" as const },
  { name: "Total Contacts Listed", value: "1,376", status: "ACTIVE", variant: "stable" as const },
  { name: "Completed Follow-up", value: "1,141", status: "SUCCESSFUL", variant: "info" as const },
  { name: "Currently Under Follow-up", value: "219", status: "IN PROGRESS", variant: "info" as const },
  { name: "Travelers Screened", value: "9,807,415", status: "CUMULATIVE", variant: "stable" as const },
  { name: "Points of Entry (POEs)", value: "26", status: "MONITORED", variant: "stable" as const },
];

function MpoxPage() {
  return (
    <AppShell title="Nutrition & Food Security" subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Cumulative Cases" value="1,123" icon="bar_chart" centered />
        <MetricCard label="Total Deaths (CFR: 1.7%)" value="19" icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (Last 7 Days)" value="4" icon="location_on" subtext="Location: Nairobi County" centered />
        <MetricCard label="Counties Affected (81%)" value="38" icon="public" centered />
        <MetricCard label="Recovered Cases (89.3%)" value="1,003" icon="health_and_safety" centered />
        <MetricCard label="Samples Sequenced" value="257" icon="biotech" subtext="9.1% Total Tested" centered />
      </div>

      <SectionCard
        title="Other Key Surveillance Metrics"
        action={<StatusPill variant="info">LIVE DATA</StatusPill>}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Metric Category</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {otherMetrics.map((m) => (
              <tr key={m.name} className="hover:bg-surface-container">
                <td className="px-6 py-4 text-body-md text-on-surface">{m.name}</td>
                <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{m.value}</td>
                <td className="px-6 py-4"><StatusPill variant={m.variant}>{m.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <MapPlaceholder
            title="Regional Distribution Map"
            body="Detailed county-level mapping of cases, recoveries, and hospital capacities across all 47 counties."
            height={420}
          />
          <div className="mt-4 text-center">
            <button className="inline-flex items-center gap-2 text-secondary text-body-md font-semibold hover:underline">
              View Full Map
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        </Card>

        <NotesCard title="Response Notes & Updates">
          <ol className="space-y-4">
            {[
              { n: "01", title: "County Activation:", body: "Response teams in Nairobi have intensified contact tracing following new identifications." },
              { n: "02", title: "Vaccination Drive:", body: "10,697 individuals vaccinated in high-risk zones, exceeding target by 5%." },
              { n: "03", title: "Lab Capacity:", body: "Sequencing throughput increased by 12% with new reagents." },
            ].map((u) => (
              <li key={u.n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
                  {u.n}
                </span>
                <p className="text-body-md text-on-surface">
                  <span className="font-semibold">{u.title}</span> {u.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 flex items-center justify-between">
            <div>
              <p className="text-label-caps text-on-surface-variant">Last Update</p>
              <p className="text-body-md font-semibold text-on-surface">May 11, 2026 | 08:00 AM</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">history</span>
          </div>
        </NotesCard>
      </div>
    </AppShell>
  );
}
