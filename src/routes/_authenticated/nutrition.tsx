import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, DocumentNotes, NotesCard, ProgressBar } from "@/components/dashboard";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { PageIntro } from "@/components/PageIntro";
import { GradeBadge } from "@/components/GradeBadge";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({
    meta: [
      { title: "Updates — WHO Kenya" },
      { name: "description", content: "ASAL and refugee zone food security, IPC phase breakdowns, and weekly epidemiological insights for Kenya." },
    ],
  }),
  component: NutritionPage,
});

type NutritionData = {
  phase3_above: number | null;
  phase4_5: number | null;
  ipc_notes: string | null;
  key_drivers: string | null;
  contributing_factors: string | null;
};
type NutritionCounty = {
  id: string;
  county_name: string | null;
  ipc_phase: number | null;
  projected_phase: number | null;
  population_affected: number | null;
};

const DASH = "—";
const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "0" : n.toLocaleString();

function phaseColor(p: number | null | undefined): string {
  switch (p) {
    case 1: return "bg-emerald-500 text-white";
    case 2: return "bg-yellow-400 text-black";
    case 3: return "bg-orange-500 text-white";
    case 4: return "bg-red-500 text-white";
    case 5: return "bg-red-900 text-white";
    default: return "bg-surface-container-high text-on-surface-variant";
  }
}

function PhaseBadge({ phase }: { phase: number | null | undefined }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-label-caps font-bold ${phaseColor(phase)}`}>
      Phase {phase ?? DASH}
    </span>
  );
}

function Skel({ w = "w-16", h = "h-5" }: { w?: string; h?: string }) {
  return <span className={`inline-block ${h} ${w} animate-pulse rounded bg-surface-container-high align-middle`} />;
}

function NutritionPage() {
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const nutrition = useTableData<NutritionData>("nutrition_data", reportId);
  const counties = useCountyData<NutritionCounty>("nutrition_counties", reportId);

  const loading = reportLoading || (reportId !== null && (nutrition.loading || counties.loading));

  if (!loading && reportId === null) {
    return (
      <AppShell title={"Nutrition & Food Security\n"} subtitle="UPDATES">
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <p className="text-body-md text-on-surface-variant">No weekly report uploaded yet.</p>
        </Card>
      </AppShell>
    );
  }

  const d = nutrition.data;
  const rows = counties.data;

  return (
    <AppShell title={"Nutrition & Food Security\n"} subtitle="UPDATES">
      <PageIntro pageKey="nutrition" defaultHeading="Nutrition & Food Security" defaultDescription="IPC classification and ASAL population at risk." />
      <div className="flex"><GradeBadge disease="nutrition" /></div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <p className="text-display-metric text-primary">{loading ? "…" : fmt(d?.phase3_above)}</p>
            <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-caps text-on-secondary-container">0 of the population</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People Facing High Levels of Acute Food Insecurity (IPC Phase 3 or Above) in ASAL</p>
          <div className="mt-6">
            <ProgressBar value={0} color="bg-secondary" track="bg-surface-container-high" height={8} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">{loading ? "…" : fmt(d?.phase4_5)}</p>
            <span className="material-symbols-outlined text-error">trending_up</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People In Emergency (Phase 4) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-error">SEVERE URGENCY</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">0</p>
            <span className="material-symbols-outlined text-secondary">change_history</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People in Crisis (Phase 3) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-secondary">HIGH VULNERABILITY</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">0</p>
            <span className="material-symbols-outlined text-on-surface-variant">bar_chart</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People Stressed (Phase 2) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-on-surface-variant">BORDERLINE AT-RISK</p>
        </Card>
      </div>

      <div
        className="flex items-center rounded-lg px-5 py-3 text-white"
        style={{ backgroundColor: "#00205c" }}
      >
        <p className="text-body-md">Data Source: Kenya IPC (Integrated Food Security Phase Classifications)</p>
      </div>


      <div>
        <h2 className="text-headline-sm font-bold text-primary">Detailed Demographic Breakdowns</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <Skel w="w-24" h="h-7" />
                  <Skel w="w-16" />
                </div>
                <div className="mt-2"><Skel w="w-32" /></div>
                <hr className="my-4 border-outline-variant" />
                <div className="flex items-center justify-between">
                  <Skel w="w-20" />
                  <Skel w="w-16" />
                </div>
              </Card>
            ))
          ) : rows.length === 0 ? (
            <Card className="p-6 md:col-span-3 text-center text-body-md text-on-surface-variant">
              No county breakdown.
            </Card>
          ) : (
            rows.map((c) => (
              <Card key={c.id} className="p-6">
                <div className="flex items-start justify-between">
                  <p className="text-2xl font-bold text-primary">{fmt(c.population_affected)}</p>
                  <PhaseBadge phase={c.ipc_phase} />
                </div>
                <p className="mt-2 text-label-caps text-on-surface-variant">{c.county_name ?? DASH}</p>
                <hr className="my-4 border-outline-variant" />
                <div className="flex items-center justify-between">
                  <p className="text-label-caps text-on-surface-variant">Projected</p>
                  <PhaseBadge phase={c.projected_phase} />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <NotesCard title="Response Notes & Updates" subtitle="Weekly Epidemiological Insight - ASAL & Refugee Zones">
        <DocumentNotes
          items={[
            { label: "IPC notes", body: d?.ipc_notes },
            { label: "Key drivers", body: d?.key_drivers },
            { label: "Contributing factors", body: d?.contributing_factors },
          ]}
        />
      </NotesCard>

      <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-label-caps text-on-surface-variant">
        <div className="flex gap-6">
          <span>System Status: <span className="text-secondary">NOMINAL</span></span>
          <span>Data Refresh: 15m ago</span>
        </div>
        <span>© 2026 World Health Organization Kenya Office. All rights reserved.</span>
      </div>
    </AppShell>
  );
}
