import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, DataSourceBanner, DocumentNotes, MetricCard, NotesCard, SectionCard } from "@/components/dashboard";
import { ResponseNotes } from "@/components/ResponseNotes";
import { SectionNotes } from "@/components/SectionNotes";
import { DiseaseMap } from "@/components/DiseaseMap";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { usePageContent } from "@/hooks/usePageContent";
import { PageIntro } from "@/components/PageIntro";
import { GradeBadge } from "@/components/GradeBadge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  response_activities: string | null;
  challenges: string | null;
  clinical_notes: string | null;
  epidemiological_summary: string | null;
  laboratory_status: string | null;
  strategic_updates: string | null;
};

type MeaslesCounty = {
  id?: string;
  county_name: string | null;
  sub_county: string | null;
  case_count: number | null;
};

function fmt(n: number | null | undefined) {
  // Unknown (not stated in the report) renders as "—", never a misleading "0".
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}

// --- Reference datasets (WHO Kenya measles bulletin, 2025-2026) ---

// Epi curve: weekly cases (suspected + confirmed) from 20-Nov-25 → 03-May-26
const epiCurve: { label: string; suspected: number; confirmed: number }[] = [
  { label: "20-Nov-25", suspected: 0, confirmed: 0 },
  { label: "24-Nov-25", suspected: 1, confirmed: 1 },
  { label: "28-Nov-25", suspected: 24, confirmed: 1 },
  { label: "02-Dec-25", suspected: 3, confirmed: 0 },
  { label: "06-Dec-25", suspected: 1, confirmed: 0 },
  { label: "10-Dec-25", suspected: 2, confirmed: 0 },
  { label: "14-Dec-25", suspected: 3, confirmed: 0 },
  { label: "18-Dec-25", suspected: 4, confirmed: 0 },
  { label: "22-Dec-25", suspected: 4, confirmed: 0 },
  { label: "26-Dec-25", suspected: 2, confirmed: 0 },
  { label: "30-Dec-25", suspected: 1, confirmed: 0 },
  { label: "03-Jan-26", suspected: 5, confirmed: 1 },
  { label: "07-Jan-26", suspected: 4, confirmed: 1 },
  { label: "11-Jan-26", suspected: 8, confirmed: 1 },
  { label: "15-Jan-26", suspected: 4, confirmed: 1 },
  { label: "19-Jan-26", suspected: 9, confirmed: 1 },
  { label: "23-Jan-26", suspected: 7, confirmed: 1 },
  { label: "27-Jan-26", suspected: 10, confirmed: 1 },
  { label: "31-Jan-26", suspected: 7, confirmed: 1 },
  { label: "04-Feb-26", suspected: 8, confirmed: 1 },
  { label: "08-Feb-26", suspected: 8, confirmed: 1 },
  { label: "12-Feb-26", suspected: 5, confirmed: 1 },
  { label: "16-Feb-26", suspected: 6, confirmed: 1 },
  { label: "20-Feb-26", suspected: 4, confirmed: 1 },
  { label: "24-Feb-26", suspected: 3, confirmed: 1 },
  { label: "28-Feb-26", suspected: 6, confirmed: 2 },
  { label: "04-Mar-26", suspected: 7, confirmed: 1 },
  { label: "08-Mar-26", suspected: 4, confirmed: 1 },
  { label: "12-Mar-26", suspected: 1, confirmed: 0 },
  { label: "16-Mar-26", suspected: 1, confirmed: 0 },
  { label: "20-Mar-26", suspected: 0, confirmed: 0 },
  { label: "24-Mar-26", suspected: 0, confirmed: 0 },
  { label: "28-Mar-26", suspected: 0, confirmed: 0 },
  { label: "01-Apr-26", suspected: 0, confirmed: 0 },
  { label: "05-Apr-26", suspected: 0, confirmed: 0 },
  { label: "09-Apr-26", suspected: 0, confirmed: 0 },
  { label: "13-Apr-26", suspected: 0, confirmed: 0 },
  { label: "17-Apr-26", suspected: 0, confirmed: 0 },
  { label: "21-Apr-26", suspected: 0, confirmed: 0 },
  { label: "25-Apr-26", suspected: 0, confirmed: 0 },
  { label: "29-Apr-26", suspected: 0, confirmed: 0 },
  { label: "03-May-26", suspected: 0, confirmed: 0 },
];

type CountyRow = {
  county: string;
  subCounty: string;
  total: number;
  confirmed: number;
  suspected: number;
  deaths: number;
  indexDate: string;
  lastDate: string;
  status: "Active" | "No new cases reported";
};

const countyRows: CountyRow[] = [
  { county: "Baringo", subCounty: "Taty East", total: 357, confirmed: 28, suspected: 329, deaths: 0, indexDate: "25-Nov-25", lastDate: "15-Mar-26", status: "No new cases reported" },
  { county: "Marsabit", subCounty: "Moyale", total: 18, confirmed: 7, suspected: 11, deaths: 0, indexDate: "18-Feb-26", lastDate: "30-Mar-26", status: "No new cases reported" },
  { county: "Garissa", subCounty: "Fafi", total: 10, confirmed: 3, suspected: 7, deaths: 0, indexDate: "27-Feb-26", lastDate: "17-Mar-26", status: "No new cases reported" },
  { county: "Garissa", subCounty: "Dadaab", total: 12, confirmed: 12, suspected: 0, deaths: 0, indexDate: "30-Jan-26", lastDate: "18-Apr-26", status: "Active" },
  { county: "Wajir", subCounty: "Wajir North", total: 12, confirmed: 12, suspected: 0, deaths: 0, indexDate: "27-Feb-26", lastDate: "05-Apr-26", status: "No new cases reported" },
];

const ageDist = [
  { name: "<1 year", value: 32 },
  { name: "1–4 years", value: 60 },
  { name: "5–9 years", value: 52 },
  { name: "10–14 years", value: 101 },
  { name: "15+ years", value: 115 },
];

const sexDist = [
  { name: "Male", value: 223 },
  { name: "Female", value: 137 },
];

const DONUT_COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--tertiary)",
  "var(--primary-container)",
  "var(--secondary-container)",
  "var(--tertiary-container)",
  "var(--error)",
  "var(--error-container)",
];

const SEX_COLORS = ["var(--primary)", "var(--secondary)"];

function MeaslesPage() {
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const content = usePageContent("measles");
  const pageTitle = content.text("header", "title", "Measles\n");
  const pageSubtitle = content.text("header", "subtitle", "UPDATES");
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const counties = useCountyData<MeaslesCounty>("measles_counties", reportId);

  const loading = reportLoading || (reportId !== null && (measles.loading || counties.loading));

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

  const d = measles.data;
  void counties;

  return (
    <AppShell title={pageTitle} subtitle={pageSubtitle}>
      <PageIntro pageKey="measles" defaultHeading="Measles Surveillance" defaultDescription="Weekly measles case counts, county distribution, and outbreak response." />
      <div className="flex"><GradeBadge disease="measles" /></div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value={loading ? "…" : fmt(d?.total_cases)} icon="person" centered />
        <MetricCard label="Total Deaths" value="0" icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value="0" icon="trending_down" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (7 Days)" value="0" icon="new_releases" centered />
        <MetricCard label="Cases Confirmed" value={loading ? "…" : fmt(d?.confirmed ?? 62)} icon="verified" centered />
        <MetricCard label="Counties Affected" value={loading ? "…" : fmt(d?.counties_affected)} icon="map" centered />
      </div>

      <DataSourceBanner pageKey="measles" defaultLabel="Data source: Ministry of Health Kenya" defaultUrl="https://www.health.go.ke/" />

      {/* Table 1: Distribution of measles cases by county */}
      <SectionCard title="Table 1: Distribution of measles cases by county 2026 — Kenya" moreInfo={{ pageKey: "measles", sectionKey: "distribution" }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {["County", "Sub County", "Total cases", "Lab Confirmed", "Suspected cases", "Total deaths", "Date of onset of Index case", "Date of onset of last case", "Outbreak status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {countyRows.map((r, i) => (
                <tr key={`${r.county}-${r.subCounty}-${i}`} className="hover:bg-surface-container">
                  <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{r.county}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.subCounty}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.total}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.confirmed}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.suspected}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.deaths}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">{r.indexDate}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">{r.lastDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        r.status === "Active"
                          ? "bg-error-container text-on-error-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-bold text-error">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3">409</td>
                <td className="px-4 py-3">62</td>
                <td className="px-4 py-3">347</td>
                <td className="px-4 py-3">0</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Epi curve */}
      <SectionCard title="Epi curve of the confirmed measles cases, Kenya, 2024–2026" moreInfo={{ pageKey: "measles", sectionKey: "epi_curve" }}>
        <div className="px-6 pb-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={epiCurve} margin={{ top: 10, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                  interval={1}
                  angle={-60}
                  textAnchor="end"
                  height={80}
                  label={{ value: "Date of onset / Year", position: "insideBottom", dy: 20, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <YAxis
                  domain={[0, 30]}
                  tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  label={{ value: "No of cases", angle: -90, position: "insideLeft", dy: 30, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="suspected" name="Suspected cases" stackId="a" fill="var(--primary)" />
                <Bar dataKey="confirmed" name="Confirmed" stackId="a" fill="#E8B84A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-center gap-6 text-body-md text-on-surface-variant" style={{ fontSize: 13 }}>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "var(--primary)" }} aria-hidden />
              Suspected cases
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#E8B84A" }} aria-hidden />
              Confirmed
            </span>
          </div>
          <SectionNotes pageKey="measles" sectionKey="epi_curve" />
        </div>
      </SectionCard>

      {/* Epidemiological analysis */}
      <SectionCard title="Epidemiological analysis of the reported cases" moreInfo={{ pageKey: "measles", sectionKey: "demographics" }}>
        <div className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-label-caps text-on-surface-variant" style={{ fontSize: 13 }}>Age distribution (N=360)</p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ageDist} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2} label={(e: { name: string; value: number }) => `${e.name}: ${e.value}`} style={{ fontSize: 12 }}>
                    {ageDist.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-label-caps text-on-surface-variant" style={{ fontSize: 13 }}>Sex distribution (N=360)</p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sexDist} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2} label={(e: { name: string; value: number }) => `${e.name}: ${e.value}`} style={{ fontSize: 12 }}>
                    {sexDist.map((_, i) => (
                      <Cell key={i} fill={SEX_COLORS[i % SEX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <SectionNotes pageKey="measles" sectionKey="demographics" className="mt-0" />
        </div>
      </SectionCard>

      <DiseaseMap disease="measles" reportId={reportId} />

      <NotesCard title="Response activities and gaps">
        <ResponseNotes
          pageKey="measles"
          fallback={
            <DocumentNotes
              items={[
                { label: "Response activities", body: d?.response_activities },
                { label: "Clinical notes", body: d?.clinical_notes },
                { label: "Epidemiological summary", body: d?.epidemiological_summary },
                { label: "Laboratory status", body: d?.laboratory_status },
                { label: "Strategic updates", body: d?.strategic_updates },
                { label: "Gaps & challenges", body: d?.challenges },
              ]}
            />
          }
        />
      </NotesCard>
    </AppShell>
  );
}
