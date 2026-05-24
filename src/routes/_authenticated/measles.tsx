import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MapPlaceholder, MetricCard, NotesCard, SectionCard } from "@/components/dashboard";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";
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
};

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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden />
      <span className="text-body-md text-on-surface">{children}</span>
    </li>
  );
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
  void counties;

  return (
    <AppShell title={"Measles\n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value={loading ? "--" : fmt(d?.total_cases)} icon="person" centered />
        <MetricCard label="Total Deaths" value="--" icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="CFR (%)" value="--" icon="trending_down" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (7 Days)" value="--" icon="new_releases" centered />
        <MetricCard label="Cases Confirmed" value={loading ? "--" : fmt(d?.confirmed ?? 62)} icon="verified" centered />
        <MetricCard label="Counties Affected" value={loading ? "--" : fmt(d?.counties_affected)} icon="map" centered />
      </div>

      {/* Table 1: Distribution of measles cases by county */}
      <SectionCard title="Table 1: Distribution of measles cases by county 2026 — Kenya">
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
      <SectionCard title="Epi curve of the confirmed measles cases, Kenya, 2024–2026">
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
          <ul className="mt-4 space-y-2">
            <Bullet>Outbreak onset in <span className="font-semibold">late Nov 2025</span> with a sharp index spike, followed by sustained transmission peaking <span className="font-semibold">Jan–Feb 2026</span> before tapering after early Mar 2026.</Bullet>
          </ul>
        </div>
      </SectionCard>

      {/* Epidemiological analysis */}
      <SectionCard title="Epidemiological analysis of the reported cases">
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
          <ul className="space-y-2">
            <Bullet>Most of the cases, <span className="font-semibold">218 (60.5%)</span> are aged ≥10 years.</Bullet>
            <Bullet>More than half are males, <span className="font-semibold">223 (62%)</span>.</Bullet>
          </ul>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 p-6">
          <h3 className="text-headline-sm text-primary">Response activities and gaps</h3>
          <div className="mt-4">
            <p className="text-label-caps text-secondary">OUTBREAK RESPONSE IMMUNISATION COMPLETED</p>
            <ul className="mt-3 space-y-2">
              <Bullet>Tiaty West sub county, Baringo county: <span className="font-semibold">9,809</span> children under 10 years vaccinated.</Bullet>
              <Bullet>Tiaty East sub county, Baringo county: <span className="font-semibold">5,789</span> children under 5 years vaccinated.</Bullet>
              <Bullet>Marsabit sub county, Moyale county: <span className="font-semibold">1,758</span> children under 15 years vaccinated.</Bullet>
              <Bullet>Active case search ongoing at health facility and community levels.</Bullet>
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-label-caps text-secondary">GAPS</p>
            <ul className="mt-3 space-y-2">
              <Bullet>Delayed sub-national reporting affecting timeliness.</Bullet>
            </ul>
          </div>
        </Card>

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
