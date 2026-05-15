import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MapPlaceholder, MetricCard, NotesCard, ProgressBar, SectionCard } from "@/components/dashboard";

export const Route = createFileRoute("/measles")({
  head: () => ({
    meta: [
      { title: "Measles Surveillance — WHO Kenya" },
      { name: "description", content: "County-level Measles vaccination coverage, case counts, and clinical response notes." },
    ],
  }),
  component: MeaslesPage,
});

const indicators = [
  { name: "Vaccination Coverage (MCV1)", metric: "82.4%", change: "1.2%", changeUp: true, target: 82, updated: "16 May 2026" },
  { name: "Vitamin A Supplementation", metric: "67.1%", change: "0.5%", changeUp: false, target: 67, updated: "15 May 2026" },
  { name: "Non-Measles Febrile Rash Rate", metric: "2.4 / 100k", change: "0%", changeUp: null, target: 50, updated: "14 May 2026" },
  { name: "Adequate Specimen Collection", metric: "91.8%", change: "4.5%", changeUp: true, target: 92, updated: "16 May 2026" },
  { name: "Active Case Search Coverage", metric: "74.2%", change: "2.1%", changeUp: true, target: 74, updated: "17 May 2026" },
];

function MeaslesPage() {
  return (
    <AppShell title="WHO Kenya Health Emergencies" subtitle="Weekly Surveillance Brief">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value="4,821" icon="person" centered />
        <MetricCard label="Total Deaths" value="82" icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value="1.7%" icon="trending_down" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (7 Days)" value="12" icon="new_releases" centered />
        <MetricCard label="Recovered" value="4,529" icon="verified" centered />
        <MetricCard label="Counties Affected" value="14" icon="map" centered />
      </div>

      <SectionCard
        title="Secondary Measles Metrics"
        action={
          <button className="inline-flex items-center gap-1 text-label-caps text-secondary hover:underline">
            VIEW FULL DATASET
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        }
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["Indicator Name", "Metric", "Change", "Target Alignment", "Last Updated"].map((h) => (
                <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {indicators.map((i) => (
              <tr key={i.name} className="hover:bg-surface-container">
                <td className="px-6 py-4 text-body-md text-on-surface">{i.name}</td>
                <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{i.metric}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 text-body-md ${i.changeUp === null ? "text-on-surface-variant" : i.changeUp ? "text-secondary" : "text-error"}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {i.changeUp === null ? "remove" : i.changeUp ? "trending_up" : "trending_down"}
                    </span>
                    {i.change}
                  </span>
                </td>
                <td className="px-6 py-4 w-64">
                  <ProgressBar value={i.target} color="bg-secondary" track="bg-surface-container-high" height={6} />
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface-variant">{i.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NotesCard title="Clinical Response Notes" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <p className="text-label-caps text-secondary">STRATEGIC UPDATE — GARISSA</p>
              <p className="mt-2 text-body-md text-on-surface">
                The SIAs (Supplementary Immunization Activities) in Garissa County have reached 92% of the targeted children under 5. Surveillance teams are currently investigating a cluster of 5 suspected cases in Dadaab sub-county.
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <p className="text-label-caps text-secondary">EPIDEMIOLOGICAL SUMMARY</p>
              <ul className="mt-2 space-y-2 text-body-md text-on-surface">
                <li>• CFR remains stable at 1.7% with no new deaths reported this week.</li>
                <li>• Wajir county is showing a declining trend for the third consecutive week.</li>
                <li>• Stockout of Vitamin A reported in 2 facilities in Mandera; replenishment underway.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <p className="text-label-caps text-secondary">LABORATORY STATUS</p>
              <p className="mt-2 text-body-md text-on-surface">
                Average turnaround time (TAT) for lab confirmation is currently 72 hours.
              </p>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-secondary py-3 text-label-caps text-secondary hover:bg-secondary-fixed/30">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              ADD INTERNAL NOTE
            </button>
          </div>
        </NotesCard>

        <Card className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-headline-sm text-primary">Geographic Measles Distribution</h3>
              <p className="text-metric-subtext text-on-surface-variant">Real-time case mapping by County and Sub-County</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-200" />1-10</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />11-50</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600" />50+</span>
            </div>
          </div>
          <MapPlaceholder
            title="Interactive Geographic Layer"
            body="Select a county to view detailed sub-county performance metrics."
            height={520}
          />
        </Card>
      </div>
    </AppShell>
  );
}
