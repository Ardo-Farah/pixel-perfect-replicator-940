import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, SectionCard, StatusPill } from "@/components/dashboard";
import { useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

export const Route = createFileRoute("/_authenticated/anthrax")({
  head: () => ({
    meta: [
      { title: "Anthrax — WHO Kenya" },
      { name: "description", content: "Human and livestock anthrax surveillance, regional risk mapping, and One Health response updates for Kenya." },
    ],
  }),
  component: AnthraxPage,
});

type AnthraxRow = {
  id?: string;
  county: string | null;
  sub_county: string | null;
  human_cases: number | null;
  human_deaths: number | null;
  animal_deaths: number | null;
  response_updates: string | null;
  prompt_action: string | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "--";
  return Number(n).toLocaleString();
}

function AnthraxPage() {
  const { selectedReportId: reportId, selectedReport, loading: reportLoading } = useSelectedReport();
  const weekNumber = selectedReport?.week_number ?? null;
  void weekNumber;
  const rows = useCountyData<AnthraxRow>("anthrax_data", reportId);
  const loading = reportLoading || (reportId !== null && rows.loading);

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={"Anthrax \n"} subtitle="UPDATES">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
        </div>
      </AppShell>
    );
  }

  const data = rows.data;
  const totalCases = data.reduce((s, r) => s + (r.human_cases ?? 0), 0);
  const totalDeaths = data.reduce((s, r) => s + (r.human_deaths ?? 0), 0);
  const totalAnimalDeaths = data.reduce((s, r) => s + (r.animal_deaths ?? 0), 0);
  const distinctCounties = new Set(data.map((r) => r.county).filter(Boolean)).size;
  const cfr = totalCases > 0 ? `${((totalDeaths / totalCases) * 100).toFixed(1)}%` : "--";
  const topCounty = data
    .filter((r) => r.county)
    .sort((a, b) => (b.human_cases ?? 0) - (a.human_cases ?? 0))[0];

  return (
    <AppShell title={"Anthrax \n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value={loading ? "--" : fmt(totalCases)} icon="person_alert" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="Total Deaths" value={loading ? "--" : fmt(totalDeaths)} icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value={loading ? "--" : cfr} icon="report_problem" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (7d)" value="--" icon="update" centered />
        <MetricCard label="Animal Deaths" value={loading ? "--" : fmt(totalAnimalDeaths)} icon="pets" centered />
        <MetricCard label="Affected Counties" value={loading ? "--" : fmt(distinctCounties)} icon="map" centered />
      </div>

      <SectionCard title="Secondary Anthrax Metrics" action={
        <div className="flex gap-2 text-on-surface-variant">
          <button className="p-1 hover:opacity-70"><span className="material-symbols-outlined">filter_list</span></button>
          <button className="p-1 hover:opacity-70"><span className="material-symbols-outlined">more_vert</span></button>
        </div>
      }>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["County", "Human Cases", "Human Deaths", "Animal Deaths", "Response Note"].map((h) => (
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-body-md text-on-surface-variant">
                  No active anthrax outbreaks reported.
                </td>
              </tr>
            ) : (
              data.map((r, i) => {
                const name = [r.county, r.sub_county].filter(Boolean).join(" — ") || "--";
                return (
                  <tr key={r.id ?? `${r.county}-${i}`} className="hover:bg-surface-container">
                    <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{name}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{fmt(r.human_cases)}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{fmt(r.human_deaths)}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{fmt(r.animal_deaths)}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">
                      {r.response_updates?.trim() || r.prompt_action?.trim() ? (
                        <StatusPill variant="info">Recorded</StatusPill>
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </SectionCard>

      <Card className="overflow-hidden">
        <div className="flex items-start justify-between p-6">
          <div>
            <p className="text-label-caps text-on-surface-variant">GEO-SPATIAL RISK</p>
            <h3 className="text-headline-sm text-primary mt-1">Geographic Anthrax Distribution</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error" />High Alert</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary-container" />Active Surveillance</span>
            <button className="ml-2 inline-flex items-center gap-1 rounded border border-outline-variant px-2 py-1">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>layers</span>
              Layers
            </button>
          </div>
        </div>
        <div className="relative h-[460px] overflow-hidden bg-tertiary">
          <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-secondary-fixed-dim/20 via-tertiary to-tertiary-container" />
          <div className="absolute left-1/2 top-1/2 h-32 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-error/40 blur-3xl" />
          <div className="absolute left-[55%] top-[55%] h-20 w-24 rounded-full bg-error/60 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-container-lowest p-6 shadow-card max-w-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary">music_note</span>
              <div>
                <h4 className="text-body-md font-semibold text-on-surface">Interactive Geographic Layer</h4>
                <p className="mt-1 text-metric-subtext text-on-surface-variant">
                  Zoom in to view local epidemiological triggers. Red zones indicate higher reported human-animal interface risk levels.
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-label-caps text-on-primary">Enable Heatmap</button>
                  <button className="rounded-lg border border-outline-variant px-3 py-1.5 text-label-caps text-on-surface">District View</button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 max-w-xs rounded-lg bg-tertiary-container/90 p-3 text-on-tertiary-container">
            <p className="text-label-caps text-inverse-on-surface">REPORT SUMMARY</p>
            <p className="mt-1 text-body-md text-inverse-on-surface">
              {loading
                ? "Loading anthrax surveillance summary."
                : topCounty
                  ? `${topCounty.county} has the highest reported human case count in this selected report.`
                  : "No county-level anthrax activity is recorded for this selected report."}
            </p>
          </div>
          <div className="absolute bottom-4 right-4 rounded-lg bg-primary px-4 py-2 text-on-primary">
            <p className="text-label-caps">SELECTED REPORT</p>
            <p className="text-body-md font-semibold">
              {loading ? "LOADING" : `${fmt(distinctCounties)} COUNTIES / ${fmt(data.length)} ROWS`}
            </p>
          </div>
        </div>
      </Card>

      {(() => {
        const notes =
          rows.data.find((r) => r.response_updates && r.response_updates.trim())?.response_updates ?? null;
        const action =
          rows.data.find((r) => r.prompt_action && r.prompt_action.trim())?.prompt_action ?? null;
        return (
          <NotesCard title="Response Updates & Clinical Notes">
            {!loading && !notes && !action ? (
              <p className="text-body-md text-on-surface-variant">No notes recorded for this report.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {notes ? (
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">Response Updates</p>
                    <p className="mt-1 whitespace-pre-line text-body-md text-on-surface-variant">{notes}</p>
                  </div>
                ) : null}
                {action ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                      <p className="flex items-center gap-2 text-label-caps text-secondary">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                        PROMPT ACTION REQUIRED
                      </p>
                      <p className="mt-2 whitespace-pre-line text-body-md text-on-surface">{action}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </NotesCard>
        );
      })()}
    </AppShell>
  );
}
