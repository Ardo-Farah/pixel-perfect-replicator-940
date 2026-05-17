import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, MapPlaceholder, SectionCard, StatusPill } from "@/components/dashboard";
import { useLatestReportId, useTableData, useCountyData } from "@/hooks/useReport";

export const Route = createFileRoute("/_authenticated/mpox")({
  head: () => ({
    meta: [
      { title: "Mpox Surveillance — WHO Kenya" },
      { name: "description", content: "Weekly Mpox surveillance metrics, lab capacity, and clinical response notes for Kenya." },
    ],
  }),
  component: MpoxPage,
});

type MpoxData = {
  cumulative_cases: number | null;
  new_cases_this_week: number | null;
  deaths: number | null;
  cfr: number | null;
  counties_affected: number | null;
};

type MpoxCounty = {
  id?: string;
  county_name: string | null;
  cases_2026: number | null;
  is_hotspot: boolean | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "--";
  return Number(n).toLocaleString();
}

function MpoxPage() {
  const { reportId, loading: reportLoading } = useLatestReportId();
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const counties = useCountyData<MpoxCounty>("mpox_counties", reportId);

  const loading = reportLoading || (reportId !== null && (mpox.loading || counties.loading));

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={"Mpox\n"} subtitle="UPDATES">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
        </div>
      </AppShell>
    );
  }

  const d = mpox.data;
  const cfrLabel = d?.cfr !== null && d?.cfr !== undefined ? `Total Deaths (CFR: ${d.cfr}%)` : "Total Deaths (CFR: --)";

  return (
    <AppShell title={"Mpox\n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Cumulative Cases" value={loading ? "--" : fmt(d?.cumulative_cases)} icon="bar_chart" centered />
        <MetricCard label={cfrLabel} value={loading ? "--" : fmt(d?.deaths)} icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (Last 7 Days)" value={loading ? "--" : fmt(d?.new_cases_this_week)} icon="location_on" centered />
        <MetricCard label="Counties Affected" value={loading ? "--" : fmt(d?.counties_affected)} icon="public" centered />
        <MetricCard label="Recovered Cases" value="--" icon="health_and_safety" centered />
        <MetricCard label="Samples Sequenced" value="--" icon="biotech" centered />
      </div>

      <SectionCard
        title="County Breakdown"
        action={<StatusPill variant="info">LIVE DATA</StatusPill>}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">County</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Cases (2026)</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-surface-container-high" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-surface-container-high" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-surface-container-high" /></td>
                </tr>
              ))
            ) : counties.data.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-body-md text-on-surface-variant">No county data.</td>
              </tr>
            ) : (
              counties.data.map((c, i) => (
                <tr key={c.id ?? `${c.county_name}-${i}`} className="hover:bg-surface-container">
                  <td className="px-6 py-4 text-body-md text-on-surface">{c.county_name ?? "--"}</td>
                  <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{fmt(c.cases_2026)}</td>
                  <td className="px-6 py-4">
                    <StatusPill variant={c.is_hotspot ? "info" : "stable"}>
                      {c.is_hotspot ? "HOTSPOT" : "MONITORED"}
                    </StatusPill>
                  </td>
                </tr>
              ))
            )}
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
