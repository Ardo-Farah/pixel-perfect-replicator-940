import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTableData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Summary — WHO Kenya" },
      { name: "description", content: "Live overview of WHO Kenya health emergencies for the latest weekly report." },
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

function fmt(v: number | null | undefined, suffix = "") {
  if (v === null || v === undefined) return `0${suffix}`;
  return `${v}${suffix}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="text-label-md text-on-surface-variant">{label}</div>
      <div className="mt-1 text-headline-sm font-bold text-on-surface">{value}</div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-5 shadow-card">
      <header className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>
          {icon}
        </span>
        <h2 className="text-title-md font-semibold text-on-surface">{title}</h2>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{children}</div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((s) => (
        <div key={s} className="rounded-xl border border-outline-variant bg-surface-container p-5">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-surface-container-high" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryPage() {
  const { selectedReportId: reportId, selectedReport, loading: reportLoading } = useSelectedReport();
  const weekNumber = selectedReport?.week_number ?? null;
  void weekNumber;
  const summary = useTableData<ReportSummary>("report_summary", reportId);
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const measles = useTableData<MeaslesData>("measles_data", reportId);

  const anyLoading =
    reportLoading || summary.loading || mpox.loading || measles.loading;

  return (
    <AppShell title="Summary" subtitle="WHO Kenya Health Emergencies">
      {reportLoading || (reportId && anyLoading) ? (
        <SkeletonGrid />
      ) : !reportId ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>
            inbox
          </span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Once a weekly report is published, the latest figures will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 shadow-card">
            <div>
              <div className="text-label-md text-on-surface-variant">Latest weekly report</div>
              <div className="text-title-lg font-bold text-primary">
                Week {weekNumber ?? "—"}, 2026
              </div>
            </div>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>
              monitoring
            </span>
          </div>

          <Section icon="monitoring" title="Situation overview">
            <Metric label="New events" value={fmt(summary.data?.new_events)} />
            <Metric label="Outbreaks" value={fmt(summary.data?.outbreaks)} />
            <Metric label="Grade 1" value={fmt(summary.data?.grade_1)} />
            <Metric label="Grade 2" value={fmt(summary.data?.grade_2)} />
            <Metric label="Grade 3" value={fmt(summary.data?.grade_3)} />
          </Section>

          <Section icon="vaccines" title="Mpox">
            <Metric label="Cumulative cases" value={fmt(mpox.data?.cumulative_cases)} />
            <Metric label="New this week" value={fmt(mpox.data?.new_cases_this_week)} />
            <Metric label="Deaths" value={fmt(mpox.data?.deaths)} />
            <Metric label="CFR" value={fmt(mpox.data?.cfr, "%")} />
            <Metric label="Counties affected" value={fmt(mpox.data?.counties_affected)} />
          </Section>

          <Section icon="sick" title="Measles">
            <Metric label="Total cases" value={fmt(measles.data?.total_cases)} />
            <Metric label="Confirmed" value={fmt(measles.data?.confirmed)} />
            <Metric label="Suspected" value={fmt(measles.data?.suspected)} />
            <Metric label="Counties affected" value={fmt(measles.data?.counties_affected)} />
          </Section>
        </div>
      )}
    </AppShell>
  );
}
