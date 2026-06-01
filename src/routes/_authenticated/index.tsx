import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/dashboard";
import { KenyaChoropleth } from "@/components/KenyaChoropleth";
import { MoreInfoButton } from "@/components/MoreInfoDialog";
import { GradeBadge } from "@/components/GradeBadge";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { usePageContent } from "@/hooks/usePageContent";
import { GRADE_STYLES, protractedDiseaseCount, type GradeKey } from "@/lib/disease-grades";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Summary — Updates" },
      { name: "description", content: "Kenya weekly health emergencies overview: Mpox, Measles, Anthrax and overall report summary." },
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
  new_cases_this_week?: number | null;
};
type AnthraxRow = {
  id: string;
  county: string | null;
  human_cases: number | null;
  human_deaths: number | null;
};

const DASH = "—";
const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "0" : n.toLocaleString();

function SummaryPage() {
  const { selectedReportId, loading: reportLoading } = useSelectedReport();
  const reportId = selectedReportId;
  const content = usePageContent("overview");
  const headerTitle = content.text("header", "title", "Kenya's Weekly Health Emergencies\n");
  const headerSubtitle = content.text("header", "subtitle", "UPDATES");
  const summaryHeading = content.text("summary", "heading", "Current Health Emergencies");
  const summaryDescription = content.text(
    "summary",
    "description",
    "Kenya is managing multiple concurrent public health emergencies. This dashboard provides a centralized overview of key surveillance data, response grades, and geospatial trends across the country to support informed decision-making.",
  );
  const summary = useTableData<ReportSummary>("report_summary", reportId);
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const anthrax = useCountyData<AnthraxRow>("anthrax_data", reportId);
  const nutritionCounties = useCountyData<{ county_name: string | null; ipc_phase: number | null }>(
    "nutrition_counties",
    reportId,
  );

  const dataLoading = reportId !== null && (summary.loading || mpox.loading || measles.loading || anthrax.loading);
  const loading = reportLoading || dataLoading;

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={headerTitle} subtitle={headerSubtitle}>
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
  const aRows = anthrax.data;

  const anthraxCumulative = aRows.reduce((sum, r) => sum + (r.human_cases ?? 0), 0);
  const anthraxDeaths = aRows.reduce((sum, r) => sum + (r.human_deaths ?? 0), 0);
  const anthraxCounties = new Set(aRows.map((r) => r.county).filter(Boolean)).size;

  const val = (v: string) => (loading ? "…" : v);

  return (
    <AppShell title={headerTitle} subtitle={headerSubtitle}>
      <div
        className="border border-outline-variant bg-card p-8"
        style={{ fontFamily: '"Source Sans Pro", sans-serif' }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-left text-2xl font-bold" style={{ color: '#009ADE' }}>{summaryHeading}</h2>
          <MoreInfoButton pageKey="overview" sectionKey="summary" title={summaryHeading} />
        </div>
        <p className="mt-3 whitespace-pre-line text-left text-lg leading-relaxed text-on-surface">
          {summaryDescription}
        </p>
      </div>


      {/* Grading row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <GradeCard label="GRADE 3" value={val(fmt(s?.grade_3))} sub="Active cases" note="Critical emergency response" grade="grade3" />
        <GradeCard label="GRADE 2" value={val(fmt(s?.grade_2))} sub="Active cases" note="Moderate severity events" grade="grade2" />
        <GradeCard label="GRADE 1" value={val(fmt(s?.grade_1))} sub="Active cases" note="Localized health impact" grade="grade1" />
        <GradeCard label="PROTRACTED" value={val(fmt(protractedDiseaseCount()))} sub="Diseases" note="Long-running emergencies" grade="protracted" />
        <GradeCard label="UNGRADED" value={val(fmt(s?.outbreaks))} sub="Ongoing events" note="Routine monitoring" grade="ungraded" />
      </div>

      {/* Stats strip */}
      <Card className="grid grid-cols-2 divide-y divide-outline-variant sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <StatCell label="NEW EVENTS" value={val(fmt(s?.new_events))} />
        <StatCell label="ONGOING EVENTS" value={val(fmt(s?.outbreaks))} />
        <StatCell label="OUTBREAKS" value={val(fmt(s?.outbreaks))} />
        <StatCell label="HUMANITARIAN CRISIS" value={val(fmt(0))} />
      </Card>

      {/* Priority Disease Summary */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">medical_information</span>
          <h2 className="text-headline-sm text-primary">Priority Disease Summary</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DiseaseCard
            title="Mpox"
            icon="coronavirus"
            to="/mpox"
            rows={[
              ["New Cases (this week)", val(fmt(m?.new_cases_this_week))],
              ["Cumulative Cases", val(fmt(m?.cumulative_cases))],
              ["Deaths", val(fmt(m?.deaths))],
              ["Counties Affected", val(fmt(m?.counties_affected))],
            ]}
          />
          <DiseaseCard
            title="Measles"
            icon="vaccines"
            to="/measles"
            rows={[
              ["New Cases (this week)", val(fmt(me?.new_cases_this_week))],
              ["Cumulative Cases", val(fmt(me?.total_cases))],
              ["Deaths", val(fmt(0))],
              ["Counties Affected", val(fmt(me?.counties_affected))],
            ]}
          />
          <DiseaseCard
            title="Anthrax"
            icon="bug_report"
            to="/anthrax"
            rows={[
              ["New Cases (this week)", DASH],
              ["Cumulative Cases", val(fmt(anthraxCumulative))],
              ["Deaths", val(fmt(anthraxDeaths))],
              ["Counties Affected", val(fmt(anthraxCounties))],
            ]}
          />
        </div>
      </div>

      {/* Kenya Concurrent Issues Map */}
      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-headline-sm text-primary">Kenya Concurrent Issues Map</h3>
            <p className="text-metric-subtext text-on-surface-variant">
              Projected IPC Acute Food Insecurity & Disease Prevalence (April–June 2026)
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-label-caps font-semibold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>public</span>
            IPC GEOSPATIAL DATA v1.06
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <KenyaChoropleth
              height={360}
              valueLabel=""
              ramp={["#fde68a", "#b91c1c"]}
              formatValue={(n) => `Phase ${n}`}
              data={nutritionCounties.data.map((c) => ({ county: c.county_name, value: c.ipc_phase }))}
              emptyMessage="No IPC county data in the latest report."
            />
          </div>
          <div className="space-y-5">
            <Legend
              title="IPC CLASSIFICATION"
              items={[
                { color: "bg-red-500", label: "Emergency" },
                { color: "bg-orange-500", label: "Crisis" },
                { color: "bg-yellow-400", label: "Stressed" },
                { color: "bg-gray-300", label: "Not Analysed" },
              ]}
            />
            <Legend
              title="DISEASE SURVEILLANCE"
              items={[
                { color: "bg-primary", label: "Mpox (>50 cases)", dot: true },
                { color: "bg-primary/50", label: "Mpox (<50 cases)", dot: true },
                { color: "bg-red-500", label: "Measles Outbreak", dot: true },
                { color: "bg-amber-700", label: "Suspected Anthrax", dot: true },
              ]}
            />
            <div className="rounded-md bg-secondary-fixed px-3 py-2 text-center text-label-caps font-bold text-on-secondary-container">
              PROJECTION PERIOD<br />APRIL — JUNE 2026
            </div>
          </div>
        </div>
      </Card>

      {/* WHO Kenya footer block */}
      <Card className="bg-white p-8 text-[#00205c]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold tracking-wider" style={{ color: '#009ADE' }}>CONTACT INFORMATION</h4>
            <ul className="mt-4 space-y-3 text-base">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#009ADE' }}>mail</span>
                <a href="mailto:communications_kenya@who.int" className="hover:underline" style={{ color: '#00205c' }}>communications_kenya@who.int</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#009ADE' }}>call</span>
                <a href="tel:+254758438522" className="hover:underline" style={{ color: '#00205c' }}>+254 758 438 522</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#009ADE' }}>location_on</span>
                UN Gigiri Complex, Nairobi, Kenya
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h4 className="text-sm font-bold tracking-wider" style={{ color: '#009ADE' }}>FOLLOW OUR PLATFORMS</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://www.linkedin.com/company/whokenya" target="_blank" rel="noreferrer" aria-label="LinkedIn"
                 className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[#009ADE] hover:text-white"
                 style={{ color: '#009ADE', borderColor: '#009ADE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
              </a>
              <a href="https://www.instagram.com/whoinkenya" target="_blank" rel="noreferrer" aria-label="Instagram"
                 className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[#009ADE] hover:text-white"
                 style={{ color: '#009ADE', borderColor: '#009ADE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://x.com/WHOKenya" target="_blank" rel="noreferrer" aria-label="Twitter / X"
                 className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[#009ADE] hover:text-white"
                 style={{ color: '#009ADE', borderColor: '#009ADE' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.facebook.com/WHOKenya" target="_blank" rel="noreferrer" aria-label="Facebook"
                 className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[#009ADE] hover:text-white"
                 style={{ color: '#009ADE', borderColor: '#009ADE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
            </div>
            <a href="https://www.afro.who.int/countries/kenya" target="_blank" rel="noreferrer"
               className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
               style={{ color: '#009ADE' }}>
              Visit the WHO Kenya website
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_outward</span>
            </a>
          </div>

          {/* Materials */}
          <div>
            <h4 className="text-sm font-bold tracking-wider" style={{ color: '#009ADE' }}>CURRENT COMMUNICATION MATERIALS</h4>
            <ul className="mt-4 space-y-3 text-base">
              <li>
                <a href="https://www.afro.who.int/countries/kenya/publication/who-kenya-emergency-bulletin-april-2026" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:underline" style={{ color: '#00205c' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#009ADE' }}>download</span>
                  Annual Report
                </a>
              </li>
              <li>
                <a href="https://www.afro.who.int/countries/kenya/publication/who-kenya-emergency-bulletin-april-2026" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:underline" style={{ color: '#00205c' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#009ADE' }}>download</span>
                  Current EPR Bulletin
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs font-semibold tracking-wider" style={{ borderColor: '#009ADE33', color: '#00205c' }}>
          MADE BY WHO KENYA COUNTRY OFFICE © 2026
        </div>
      </Card>
    </AppShell>
  );
}

function GradeCard({
  label, value, sub, note, accent, labelColor,
}: { label: string; value: string; sub: string; note: string; accent: string; labelColor: string }) {
  return (
    <Card className={`flex flex-col gap-1 border-l-4 p-5 ${accent}`}>
      <p className={`text-label-caps font-bold ${labelColor}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-display-metric font-bold text-primary">{value}</p>
        <p className="text-body-md text-on-surface-variant">{sub}</p>
      </div>
      <p className="text-metric-subtext italic text-on-surface-variant">{note}</p>
    </Card>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
      <p className="text-display-metric font-bold text-primary">{value}</p>
      <p className="mt-1 text-label-caps text-on-surface-variant">{label}</p>
    </div>
  );
}

function DiseaseCard({
  title, icon, to, rows,
}: { title: string; icon: string; to: string; rows: Array<[string, string]> }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-fixed text-secondary">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </span>
        <h3 className="text-headline-sm text-primary">{title}</h3>
      </div>
      <ul className="flex-1 space-y-3 text-body-md">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between border-b border-outline-variant/60 pb-2 last:border-0">
            <span className="text-on-surface-variant">{label}</span>
            <span className="font-semibold text-on-surface">{value}</span>
          </li>
        ))}
      </ul>
      <Link to={to} className="mt-6 inline-flex items-center gap-1 text-label-caps font-semibold text-primary hover:underline">
        VIEW FULL DETAIL
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </Link>
    </Card>
  );
}

function Legend({
  title, items,
}: { title: string; items: Array<{ color: string; label: string; dot?: boolean }> }) {
  return (
    <div>
      <p className="mb-2 text-label-caps font-bold text-on-surface-variant">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-body-md text-on-surface">
            <span className={`inline-block ${it.dot ? "h-2.5 w-2.5 rounded-full" : "h-3 w-4 rounded-sm"} ${it.color}`} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
