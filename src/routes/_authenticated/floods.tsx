import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, ProgressBar } from "@/components/dashboard";
import { useTableData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { PageIntro } from "@/components/PageIntro";

export const Route = createFileRoute("/_authenticated/floods")({
  head: () => ({
    meta: [
      { title: "Floods & MAM Rains — WHO Kenya" },
      { name: "description", content: "Floods and MAM Rains situation report: counties affected, displacement, search & rescue, and clinical response." },
    ],
  }),
  component: FloodsPage,
});

type FloodsData = {
  counties_affected: number | null;
  total_deaths: number | null;
  missing_persons: number | null;
  nairobi_deaths: number | null;
  eastern_deaths: number | null;
  rift_valley_deaths: number | null;
  nyanza_deaths: number | null;
  western_deaths: number | null;
  health_facility_status: string | null;
  supplies_logistics: string | null;
  epidemiological_risks: string | null;
  prompt_action: string | null;
};

const DASH = "—";
const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? DASH : n.toLocaleString();

function FloodsPage() {
  const { selectedReportId: reportId, selectedReport, loading: reportLoading } = useSelectedReport();
  const weekNumber = selectedReport?.week_number ?? null;
  void weekNumber;
  const floods = useTableData<FloodsData>("floods_data", reportId);

  const loading = reportLoading || (reportId !== null && floods.loading);
  const row = floods.data;

  if (!loading && reportId === null) {
    return (
      <AppShell title={"Floods & MAM Rains\n"} subtitle="UPDATES">
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <p className="text-body-md text-on-surface-variant">No weekly report uploaded yet.</p>
        </Card>
      </AppShell>
    );
  }

  const regions = [
    { name: "Nairobi", deaths: row?.nairobi_deaths ?? null },
    { name: "Eastern", deaths: row?.eastern_deaths ?? null },
    { name: "Rift Valley", deaths: row?.rift_valley_deaths ?? null },
    { name: "Nyanza", deaths: row?.nyanza_deaths ?? null },
    { name: "Western", deaths: row?.western_deaths ?? null },
  ];
  const maxDeaths = Math.max(0, ...regions.map((r) => r.deaths ?? 0));

  const Skel = ({ w = "w-16" }: { w?: string }) => (
    <span className={`inline-block h-5 ${w} animate-pulse rounded bg-surface-container-high align-middle`} />
  );

  return (
    <AppShell title={"Floods & MAM Rains\n"} subtitle="UPDATES">
      <PageIntro pageKey="floods" defaultHeading="Floods & MAM Rains" defaultDescription="Impact of the March–April–May long rains across affected counties." />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Counties Affected" value={loading ? "…" : fmt(row?.counties_affected)} icon="map" subtext="+2 from last week" centered />
        <MetricCard label="Deaths" value={loading ? "…" : fmt(row?.total_deaths)} icon="warning" iconColor="text-error" valueColor="text-error" subtext="+5 reported today" subtextColor="text-error" centered />
        <MetricCard label="People Affected" value={DASH} icon="groups" subtext="+1.2k since Monday" centered />
        <MetricCard label="Households Displaced" value={DASH} icon="location_on" subtext="Priority 1 status" centered />
        <MetricCard label="Missing" value={loading ? "…" : fmt(row?.missing_persons)} icon="person_search" subtext="Search & Rescue active" centered />
        <MetricCard label="Injured" value={DASH} icon="medical_services" subtext="Under clinical care" centered />
      </div>

      <div
        className="flex items-center justify-between rounded-lg px-5 py-3 text-white"
        style={{ backgroundColor: "#00205c" }}
      >
        <p className="text-body-md">Data source: National Disaster Operations Centre</p>
        <a
          href="https://www.ndoc.go.ke/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-md underline hover:opacity-80"
        >
          Click here for link
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-start justify-between p-6">
            <div>
              <p className="text-label-caps text-on-surface-variant">GEO-SPATIAL RISK</p>
              <h3 className="text-headline-sm text-primary mt-1">Kenya County Map</h3>
              <p className="text-metric-subtext text-on-surface-variant">Floods & MAM Rains distribution by county</p>
            </div>
            <div className="flex gap-2 text-on-surface-variant">
              <button className="rounded border border-outline-variant p-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_in</span></button>
              <button className="rounded border border-outline-variant p-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_out</span></button>
            </div>
          </div>
          <div className="relative h-[460px] overflow-hidden bg-gradient-to-br from-secondary-fixed via-secondary-fixed-dim/40 to-tertiary-container">
            <div className="absolute left-[35%] top-[55%] h-32 w-32 rounded-full bg-orange-400/40 blur-3xl" />
            <div className="absolute left-[45%] top-[60%] h-20 w-20 rounded-full bg-rose-500/40 blur-2xl" />
            <div className="absolute bottom-6 left-6 max-w-xs rounded-lg bg-surface-container-lowest p-4 shadow-card">
              <p className="text-label-caps text-secondary">ACTIVE MONITORING</p>
              <p className="mt-1 text-body-md font-semibold text-on-surface">Tana River & Garissa</p>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Sustained river levels above threshold. Mobile clinics deployed to flood-affected sub-counties.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-sm text-primary">County Breakdown</h3>
            <div className="flex gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">filter_list</span>
              <span className="material-symbols-outlined">more_vert</span>
            </div>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">Top Affected Regions</p>
          <ul className="mt-3 space-y-4">
            {regions.map((r) => {
              const pct = maxDeaths > 0 && r.deaths != null ? (r.deaths / maxDeaths) * 100 : 0;
              return (
                <li key={r.name}>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface font-semibold">{r.name}</span>
                    <span className="text-on-surface-variant">{loading ? <Skel w="w-12" /> : `${fmt(r.deaths)} Deaths`}</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={loading ? 0 : pct} color="bg-secondary" track="bg-surface-container-high" height={6} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex items-center justify-between text-metric-subtext text-on-surface-variant">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary" />Inundated Zones</span>
            <span>Updated 2h ago</span>
          </div>
        </Card>
      </div>

      {(() => {
        const items = [
          { title: "Health Facility Status:", value: row?.health_facility_status },
          { title: "Supplies & Logistics:", value: row?.supplies_logistics },
          { title: "Epidemiological Risks:", value: row?.epidemiological_risks },
        ].filter((i) => i.value && i.value.trim()) as { title: string; value: string }[];
        const action =
          row?.prompt_action && row.prompt_action.trim() ? row.prompt_action : null;
        const all = [...items];
        if (action) all.push({ title: "Prompt Action:", value: action });
        return (
          <NotesCard title="Response Notes & Updates">
            {!loading && all.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No notes recorded for this report.</p>
            ) : (
              <ol className="space-y-4">
                {all.map((it, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="text-body-md text-on-surface">
                      <span className="font-semibold">{it.title}</span> {it.value}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </NotesCard>
        );
      })()}
    </AppShell>
  );
}
