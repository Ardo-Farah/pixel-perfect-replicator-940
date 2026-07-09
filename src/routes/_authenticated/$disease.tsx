import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataSourceBanner, MetricCard, NotesCard, SectionCard, StatusPill } from "@/components/dashboard";
import { ResponseNotes } from "@/components/ResponseNotes";
import { useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { usePageContent } from "@/hooks/usePageContent";
import { DiseaseMap } from "@/components/DiseaseMap";
import { PageIntro } from "@/components/PageIntro";
import { GradeBadge } from "@/components/GradeBadge";
import { getDisease } from "@/lib/diseases";

// Generic, config-driven disease page used by every "lean" disease declared in
// src/lib/diseases.ts (Ebola, Cholera, Dengue, …). Bespoke diseases (mpox,
// measles, nutrition, idsr) have their own static route files, which TanStack
// Router matches BEFORE this dynamic `$disease` route, so they are unaffected.

export const Route = createFileRoute("/_authenticated/$disease")({
  component: GenericDiseasePage,
});

type LeanRow = {
  id?: string;
  county: string | null;
  sub_county: string | null;
  cases: number | null;
  deaths: number | null;
  response_updates: string | null;
  prompt_action: string | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "0";
  return Number(n).toLocaleString();
}

function GenericDiseasePage() {
  const { disease: diseaseKey } = Route.useParams();
  const d = getDisease(diseaseKey);
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const content = usePageContent(d?.key ?? diseaseKey);

  // Unknown key, or a bespoke disease that should be served by its own route.
  if (!d || d.custom || !d.table) {
    return (
      <AppShell title="Not found" subtitle="UPDATES">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>help</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">This section doesn’t exist.</h2>
          <Link to="/" className="mt-4 inline-flex items-center gap-1 text-label-caps font-semibold text-primary hover:underline">
            Back to Summary
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  return <DiseaseBody d={d} reportId={reportId} reportLoading={reportLoading} content={content} />;
}

function DiseaseBody({
  d, reportId, reportLoading, content,
}: {
  d: NonNullable<ReturnType<typeof getDisease>>;
  reportId: string | null;
  reportLoading: boolean;
  content: ReturnType<typeof usePageContent>;
}) {
  const pageTitle = content.text("header", "title", `${d.label}\n`);
  const pageSubtitle = content.text("header", "subtitle", "UPDATES");
  const rows = useCountyData<LeanRow>(d.table!, reportId);
  const loading = reportLoading || (reportId !== null && rows.loading);

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={pageTitle} subtitle={pageSubtitle}>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
        </div>
      </AppShell>
    );
  }

  const data = rows.data;
  // No rows for this disease in the selected report = unknown ("—"), not a real 0.
  const hasRows = data.length > 0;
  const totalCases = hasRows ? data.reduce((s, r) => s + (r.cases ?? 0), 0) : null;
  const totalDeaths = hasRows ? data.reduce((s, r) => s + (r.deaths ?? 0), 0) : null;
  const distinctCounties = hasRows ? new Set(data.map((r) => r.county).filter(Boolean)).size : null;
  const cfr = !hasRows
    ? "—"
    : (totalCases ?? 0) > 0
      ? `${(((totalDeaths ?? 0) / (totalCases ?? 1)) * 100).toFixed(1)}%`
      : "0%";

  return (
    <AppShell title={pageTitle} subtitle={pageSubtitle}>
      <PageIntro
        pageKey={d.key}
        defaultHeading={d.intro?.heading ?? `${d.label} Surveillance`}
        defaultDescription={d.intro?.description ?? `Weekly ${d.label} case counts and response by county.`}
      />
      <div className="flex"><GradeBadge disease={d.key} /></div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value={loading ? "…" : fmt(totalCases)} icon="person_alert" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="Total Deaths" value={loading ? "…" : fmt(totalDeaths)} icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value={loading ? "…" : cfr} icon="report_problem" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="Affected Counties" value={loading ? "…" : fmt(distinctCounties)} icon="map" centered />
      </div>

      <DataSourceBanner
        pageKey={d.key}
        defaultLabel={d.source?.label ?? "Data source: Ministry of Health Kenya"}
        defaultUrl={d.source?.url ?? "https://www.health.go.ke/"}
      />

      <DiseaseMap disease={d.key} reportId={reportId} />

      <SectionCard title={`${d.label} cases by county`} moreInfo={{ pageKey: d.key, sectionKey: "distribution" }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {["County", "Cases", "Deaths", "Response"].map((h) => (
                  <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-body-md text-on-surface-variant">
                    No {d.label.toLowerCase()} cases reported for this report.
                  </td>
                </tr>
              ) : (
                data.map((r, i) => {
                  const name = [r.county, r.sub_county].filter(Boolean).join(" — ") || "--";
                  return (
                    <tr key={r.id ?? `${r.county}-${i}`} className="hover:bg-surface-container">
                      <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{name}</td>
                      <td className="px-6 py-4 text-body-md text-on-surface">{fmt(r.cases)}</td>
                      <td className="px-6 py-4 text-body-md text-on-surface">{fmt(r.deaths)}</td>
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

      <NotesCard title="Response Notes & Updates">
        <ResponseNotes pageKey={d.key} />
      </NotesCard>
    </AppShell>
  );
}
