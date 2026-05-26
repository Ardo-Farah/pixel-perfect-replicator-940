import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MapPlaceholder } from "@/components/dashboard";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

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
  n === null || n === undefined ? DASH : n.toLocaleString();

function SummaryPage() {
  const { selectedReportId, loading: reportLoading } = useSelectedReport();
  const reportId = selectedReportId;
  const summary = useTableData<ReportSummary>("report_summary", reportId);
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const anthrax = useCountyData<AnthraxRow>("anthrax_data", reportId);

  const dataLoading = reportId !== null && (summary.loading || mpox.loading || measles.loading || anthrax.loading);
  const loading = reportLoading || dataLoading;

  if (!reportLoading && reportId === null) {
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
  const aRows = anthrax.data;

  const anthraxCumulative = aRows.reduce((sum, r) => sum + (r.human_cases ?? 0), 0);
  const anthraxDeaths = aRows.reduce((sum, r) => sum + (r.human_deaths ?? 0), 0);
  const anthraxCounties = new Set(aRows.map((r) => r.county).filter(Boolean)).size;

  const val = (v: string) => (loading ? "…" : v);

  return (
    <AppShell title={"Kenya's Weekly Health Emergencies\n"} subtitle="UPDATES">
      <p className="max-w-4xl text-body-md text-on-surface-variant">
        Kenya is managing multiple concurrent public health emergencies. This dashboard provides a centralized
        overview of key surveillance data, response grades, and geospatial trends across the country to support
        informed decision-making.
      </p>

      {/* Grading row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <GradeCard label="GRADE 3" value={val(fmt(s?.grade_3))} sub="Active cases" note="Critical emergency response" accent="border-l-red-600" labelColor="text-red-600" />
        <GradeCard label="GRADE 2" value={val(fmt(s?.grade_2))} sub="Active cases" note="Moderate severity events" accent="border-l-orange-500" labelColor="text-orange-500" />
        <GradeCard label="GRADE 1" value={val(fmt(s?.grade_1))} sub="Active cases" note="Localized health impact" accent="border-l-yellow-400" labelColor="text-yellow-500" />
        <GradeCard label="UNGRADED" value={val(fmt(s?.outbreaks))} sub="Ongoing events" note="Routine monitoring" accent="border-l-gray-400" labelColor="text-on-surface-variant" />
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
            <MapPlaceholder height={360} />
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
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h4 className="text-headline-sm text-primary">WHO KENYA</h4>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Working for a healthier world. WHO's primary role is to direct and coordinate international health
              within the United Nations system.
            </p>
          </div>
          <div>
            <h4 className="text-label-caps text-on-surface-variant">CONTACT INFORMATION</h4>
            <ul className="mt-3 space-y-2 text-body-md text-on-surface">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>mail</span>communications_kenya@who.int</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>call</span>+254 700 000 000</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>location_on</span>UN Gigiri Complex, Nairobi, Kenya</li>
            </ul>
          </div>
          <div>
            <h4 className="text-label-caps text-on-surface-variant">FOLLOW OUR UPDATES</h4>
            <div className="mt-3 flex gap-3">
              {["public", "share", "photo_camera"].map((i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{i}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-outline-variant pt-4 text-label-caps text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <span>MADE BY WHO KENYA COUNTRY OFFICE © 2026</span>
          <span>Privacy Policy · Terms of Use · Surveillance Guidelines</span>
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
