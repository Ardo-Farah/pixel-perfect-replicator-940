import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/dashboard";
import { useTableData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Summary — Updates" },
      { name: "description", content: "Kenya weekly health emergencies overview: Mpox, Measles, Floods and overall report summary." },
    ],
  }),
  component: SummaryPage,
});

type ReportSummary = {
  new_events: number | null;
  outbreaks: number | null;
  grade_1: number | null;
  grade_2: number | null;
  grade_3: number | null;
};
type MpoxData = {
  cumulative_cases: number | null;
  new_cases_this_week: number | null;
  deaths: number | null;
  cfr: number | null;
  counties_affected: number | null;
};
type MeaslesData = {
  total_cases: number | null;
  confirmed: number | null;
  suspected: number | null;
  counties_affected: number | null;
};
type FloodsData = {
  counties_affected: number | null;
  total_deaths: number | null;
  missing_persons: number | null;
};

const DASH = "—";
const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? DASH : n.toLocaleString();
const pctFmt = (n: number | null | undefined) =>
  n === null || n === undefined ? DASH : `${n}%`;

function SummaryPage() {
  const { reports, selectedReportId, selectedReport, loading: reportLoading } = useSelectedReport();
  const reportId = selectedReportId;
  const weekNumber = selectedReport?.week_number ?? null;
  const summary = useTableData<ReportSummary>("report_summary", reportId);
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const floods = useTableData<FloodsData>("floods_data", reportId);

  const dataLoading = reportId !== null && (summary.loading || mpox.loading || measles.loading || floods.loading);
  const loading = reportLoading || dataLoading;

  if (!reportLoading && reports.length === 0) {
    return (
      <AppShell title={"Kenya's Weekly Health Emergencies\n"} subtitle="UPDATES">
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="text-headline-sm text-primary">No weekly report uploaded yet.</h2>
          <p className="max-w-md text-body-md text-on-surface-variant">
            Upload a PPTX or Excel file to populate this dashboard.
          </p>
        </Card>
      </AppShell>
    );
  }

  const s = summary.data;
  const m = mpox.data;
  const me = measles.data;
  const f = floods.data;
  const val = (v: string) => (loading ? "…" : v);

  return (
    <AppShell title={"Kenya's Weekly Health Emergencies\n"} subtitle="UPDATES">
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-body-md text-on-surface">
          <span className="material-symbols-outlined text-secondary">calendar_today</span>
          Week {loading ? "…" : weekNumber ?? DASH}
        </div>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-caps text-on-surface-variant">
          Kenya National View
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="NEW EVENTS" icon="event_note" iconColor="text-secondary" value={val(fmt(s?.new_events))} subtext={`Grade 1: ${loading ? "…" : fmt(s?.grade_1)}`} />
        <KpiCard label="ACTIVE OUTBREAKS" icon="warning" iconColor="text-error" value={val(fmt(s?.outbreaks))} subtext="Across reporting counties" />
        <KpiCard label="GRADE 2 EVENTS" icon="flag" iconColor="text-primary" value={val(fmt(s?.grade_2))} subtext="Moderate severity" />
        <KpiCard label="GRADE 3 EVENTS" icon="emergency" iconColor="text-error" value={val(fmt(s?.grade_3))} subtext="High severity" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DiseaseCard
          title="Mpox"
          icon="coronavirus"
          to="/mpox"
          rows={[
            ["Cumulative Cases", val(fmt(m?.cumulative_cases))],
            ["New (this week)", val(fmt(m?.new_cases_this_week))],
            ["Deaths", val(fmt(m?.deaths))],
            ["CFR", val(pctFmt(m?.cfr))],
            ["Counties Affected", val(fmt(m?.counties_affected))],
          ]}
        />
        <DiseaseCard
          title="Measles"
          icon="sick"
          to="/measles"
          rows={[
            ["Total Cases", val(fmt(me?.total_cases))],
            ["Confirmed", val(fmt(me?.confirmed))],
            ["Suspected", val(fmt(me?.suspected))],
            ["Counties Affected", val(fmt(me?.counties_affected))],
          ]}
        />
        <DiseaseCard
          title="Floods & MAM Rains"
          icon="water_drop"
          to="/floods"
          rows={[
            ["Counties Affected", val(fmt(f?.counties_affected))],
            ["Deaths", val(fmt(f?.total_deaths))],
            ["Missing", val(fmt(f?.missing_persons))],
          ]}
        />
      </div>
    </AppShell>
  );
}

function KpiCard({
  label, value, icon, iconColor, subtext,
}: { label: string; value: string; icon: string; iconColor: string; subtext: string }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-label-caps text-on-surface-variant truncate">{label}</p>
        <span className={`material-symbols-outlined opacity-70 shrink-0 ${iconColor}`}>{icon}</span>
      </div>
      <p className="text-display-metric font-bold text-primary truncate">{value}</p>
      <p className="text-metric-subtext text-on-surface-variant">{subtext}</p>
    </Card>
  );
}

function DiseaseCard({
  title, icon, to, rows,
}: { title: string; icon: string; to: string; rows: Array<[string, string]> }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">{icon}</span>
        <h3 className="text-headline-sm text-primary">{title}</h3>
      </div>
      <ul className="flex-1 space-y-3 text-body-md">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between">
            <span className="text-on-surface-variant">{label}</span>
            <span className="font-semibold text-on-surface">{value}</span>
          </li>
        ))}
      </ul>
      <Link to={to} className="mt-6 inline-flex items-center gap-1 text-label-caps font-semibold text-primary hover:underline">
        View detail
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </Link>
    </Card>
  );
}
