import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MapPlaceholder, MetricCard, NotesCard, ProgressBar, SectionCard } from "@/components/dashboard";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

export const Route = createFileRoute("/_authenticated/measles")({
  head: () => ({
    meta: [
      { title: "Measles Surveillance — WHO Kenya" },
      { name: "description", content: "County-level Measles vaccination coverage, case counts, and clinical response notes." },
    ],
  }),
  component: MeaslesPage,
});

type MeaslesData = {
  total_cases: number | null;
  confirmed: number | null;
  suspected: number | null;
  counties_affected: number | null;
  clinical_notes: string | null;
  epidemiological_summary: string | null;
  laboratory_status: string | null;
  strategic_updates: string | null;
};

function NoteBlocks({
  loading,
  notes,
}: {
  loading: boolean;
  notes: { label: string; value: string | null | undefined }[];
}) {
  const present = notes.filter((n) => n.value && n.value.trim());
  if (!loading && present.length === 0) {
    return <p className="text-body-md text-on-surface-variant">No notes recorded for this report.</p>;
  }
  return (
    <>
      {present.map((n) => (
        <div key={n.label} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-label-caps text-secondary">{n.label}</p>
          <p className="mt-2 whitespace-pre-line text-body-md text-on-surface">{n.value}</p>
        </div>
      ))}
    </>
  );
}

type MeaslesCounty = {
  id?: string;
  county_name: string | null;
  sub_county: string | null;
  case_count: number | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "--";
  return Number(n).toLocaleString();
}

function MeaslesPage() {
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const counties = useCountyData<MeaslesCounty>("measles_counties", reportId);

  const loading = reportLoading || (reportId !== null && (measles.loading || counties.loading));

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={"Measles\n"} subtitle="UPDATES">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
        </div>
      </AppShell>
    );
  }

  const d = measles.data;

  return (
    <AppShell title={"Measles\n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value={loading ? "--" : fmt(d?.total_cases)} icon="person" centered />
        <MetricCard label="Total Deaths" value="--" icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value="--" icon="trending_down" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (7 Days)" value="--" icon="new_releases" centered />
        <MetricCard label="Recovered" value="--" icon="verified" centered />
        <MetricCard label="Counties Affected" value={loading ? "--" : fmt(d?.counties_affected)} icon="map" centered />
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
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["Indicator Name", "Metric", "Change", "Target Alignment", "Last Updated"].map((h) => (
                <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" /></td>
                  ))}
                </tr>
              ))
            ) : counties.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-body-md text-on-surface-variant">No county data.</td>
              </tr>
            ) : (
              counties.data.map((c, i) => {
                const name = [c.county_name, c.sub_county].filter(Boolean).join(" — ") || "--";
                return (
                  <tr key={c.id ?? `${c.county_name}-${i}`} className="hover:bg-surface-container">
                    <td className="px-6 py-4 text-body-md text-on-surface">{name}</td>
                    <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{fmt(c.case_count)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-body-md text-on-surface-variant">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                        --
                      </span>
                    </td>
                    <td className="px-6 py-4 w-64">
                      <ProgressBar value={0} color="bg-secondary" track="bg-surface-container-high" height={6} />
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">--</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NotesCard title="Clinical Response Notes" className="lg:col-span-1">
          <div className="space-y-4">
            <NoteBlocks
              loading={loading}
              notes={[
                { label: "STRATEGIC UPDATES", value: d?.strategic_updates },
                { label: "EPIDEMIOLOGICAL SUMMARY", value: d?.epidemiological_summary },
                { label: "LABORATORY STATUS", value: d?.laboratory_status },
                { label: "CLINICAL NOTES", value: d?.clinical_notes },
              ]}
            />
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
