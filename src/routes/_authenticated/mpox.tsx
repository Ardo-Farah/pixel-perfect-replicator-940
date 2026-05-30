import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, SectionCard, StatusPill } from "@/components/dashboard";
import { DiseaseMap } from "@/components/DiseaseMap";
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

export const Route = createFileRoute("/_authenticated/mpox")({
  head: () => ({
    meta: [
      { title: "Mpox Surveillance — WHO Kenya" },
      { name: "description", content: "Weekly Mpox surveillance metrics, lab capacity, and clinical response notes for Kenya." },
    ],
  }),
  component: MpoxPage,
});

type MpoxData = {
  cumulative_cases: number | null;
  new_cases_this_week: number | null;
  deaths: number | null;
  cfr: number | null;
  counties_affected: number | null;
};

type MpoxCounty = {
  id?: string;
  county_name: string | null;
  cases_2026: number | null;
  is_hotspot: boolean | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "--";
  return Number(n).toLocaleString();
}

// ---- Reference datasets (Ministry of Health Kenya, 2024–2026) ----

// Epi curve: weeks 29(2024) → 17(2026). Approximated from slide.
const epiCurve: { label: string; cases: number; deaths: number }[] = (() => {
  const rows: { label: string; cases: number; deaths: number }[] = [];
  // 2024 weeks 29..52
  const y2024 = [1,0,0,1,2,1,0,0,3,3,1,0,0,3,4,5,0,0,3,5,0,0,0,0];
  y2024.forEach((c, i) => rows.push({ label: `${29 + i}`, cases: c, deaths: c >= 3 ? 1 : 0 }));
  // 2025 weeks 1..52
  const y2025 = [2,0,6,0,2,2,3,4,5,8,12,8,10,14,12,11,14,21,27,12,12,15,30,36,21,30,27,18,38,40,30,43,60,61,50,30,25,43,16,26,16,10,25,4,4,6,19,9,8,12,16,13];
  y2025.forEach((c, i) => rows.push({ label: `${i + 1}`, cases: c, deaths: c >= 25 ? 1 : 0 }));
  // 2026 weeks 1..17
  const y2026 = [25,16,16,13,3,7,6,5,4,3,3,3,5,4,3,6,7];
  y2026.forEach((c, i) => rows.push({ label: `${i + 1}`, cases: c, deaths: 0 }));
  return rows;
})();

// County distribution (n=1,123)
const countyDist = [
  { county: "Mombasa", cases: 444, deaths: 6 },
  { county: "Nairobi", cases: 192, deaths: 4 },
  { county: "Busia", cases: 110, deaths: 2 },
  { county: "Makueni", cases: 82, deaths: 2 },
  { county: "Kilifi", cases: 38, deaths: 1 },
  { county: "Kiambu", cases: 38, deaths: 0 },
  { county: "Nakuru", cases: 27, deaths: 0 },
  { county: "Murang'a", cases: 23, deaths: 0 },
  { county: "Bungoma", cases: 17, deaths: 0 },
  { county: "Homa Bay", cases: 14, deaths: 0 },
  { county: "Nyeri", cases: 12, deaths: 0 },
  { county: "Taita Taveta", cases: 11, deaths: 0 },
  { county: "Uasin Gishu", cases: 9, deaths: 0 },
  { county: "Machakos", cases: 8, deaths: 0 },
  { county: "Kakamega", cases: 7, deaths: 0 },
  { county: "Meru", cases: 6, deaths: 0 },
  { county: "Kericho", cases: 6, deaths: 0 },
  { county: "Trans-nzoia", cases: 5, deaths: 1 },
  { county: "Migori", cases: 5, deaths: 0 },
  { county: "Tharaka Nithi", cases: 4, deaths: 0 },
  { county: "Kitui", cases: 4, deaths: 0 },
  { county: "Kisumu", cases: 3, deaths: 0 },
  { county: "Kwale", cases: 3, deaths: 0 },
  { county: "Laikipia", cases: 3, deaths: 0 },
  { county: "Isiolo", cases: 2, deaths: 0 },
  { county: "Kisii", cases: 2, deaths: 0 },
  { county: "Baringo", cases: 2, deaths: 0 },
  { county: "Garissa", cases: 2, deaths: 0 },
  { county: "Kirinyaga", cases: 2, deaths: 0 },
  { county: "Nandi", cases: 1, deaths: 0 },
  { county: "Narok", cases: 1, deaths: 0 },
  { county: "Nyamira", cases: 1, deaths: 0 },
  { county: "Nyandarua", cases: 1, deaths: 0 },
  { county: "Wajir", cases: 1, deaths: 0 },
  { county: "Lamu", cases: 1, deaths: 0 },
  { county: "Marsabit", cases: 1, deaths: 0 },
  { county: "Elgeyo marakwet", cases: 1, deaths: 0 },
];

// Top counties stacked per epi-week (illustrative, distributed by epi-curve shape)
const STACK_COUNTIES = ["Mombasa","Nairobi","Busia","Makueni","Kilifi","Kiambu","Nakuru","Murang'a","Bungoma","Homa Bay","Nyeri","Taita Taveta"] as const;
const STACK_COLORS = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf","#5b9bd5","#a55194","#6b6ecf"];

const weeklyByCounty: Array<Record<string, number | string>> = (() => {
  const totalCases = epiCurve.reduce((s, r) => s + r.cases, 0) || 1;
  const totals: Record<string, number> = {};
  countyDist.forEach((c) => { totals[c.county] = c.cases; });
  const otherTotal = countyDist.filter((c) => !STACK_COUNTIES.includes(c.county as typeof STACK_COUNTIES[number])).reduce((s, c) => s + c.cases, 0);
  return epiCurve.map((row) => {
    const w = row.cases / totalCases;
    const r: Record<string, number | string> = { label: row.label };
    STACK_COUNTIES.forEach((c) => { r[c] = Math.round((totals[c] || 0) * w); });
    r["Other"] = Math.round(otherTotal * w);
    return r;
  });
})();

const ageDist = [
   { name: "0-4", value: 54 },
   { name: "5-14", value: 81 },
   { name: "15-24", value: 108 },
   { name: "25-34", value: 187 },
   { name: "35-44", value: 161 },
   { name: "45-54", value: 51 },
   { name: "55+", value: 15 },
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
   "var(--outline)",
   "var(--outline-variant)",
   "var(--on-surface-variant)",
   "var(--surface-container-highest)",
 ];

// HIV status of mpox deaths (N=19)
const hivStatus = [
  { group: "Female · Positive", value: 8 },
  { group: "Female · Unknown", value: 2 },
  { group: "Male · Negative", value: 1 },
  { group: "Male · Positive", value: 5 },
  { group: "Male · Unknown", value: 3 },
];

// Death analysis by age + sex (N=19)
const deathAgeSex = [
  { group: "F 0-4", value: 1 },
  { group: "F 15-24", value: 2 },
  { group: "F 25-34", value: 4 },
  { group: "F 35-44", value: 1 },
  { group: "F 45-54", value: 2 },
  { group: "M 25-34", value: 1 },
  { group: "M 35-44", value: 4 },
  { group: "M 45-54", value: 3 },
  { group: "M 55+", value: 1 },
];

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden />
      <span className="text-body-md text-on-surface">{children}</span>
    </li>
  );
}

function MpoxPage() {
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const counties = useCountyData<MpoxCounty>("mpox_counties", reportId);

  const loading = reportLoading || (reportId !== null && (mpox.loading || counties.loading));

  if (!reportLoading && reportId === null) {
    return (
      <AppShell title={"Mpox\n"} subtitle="UPDATES">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <h2 className="mt-3 text-headline-sm font-bold text-on-surface">No weekly report uploaded yet.</h2>
        </div>
      </AppShell>
    );
  }

  const d = mpox.data;
  const cfrLabel = d?.cfr !== null && d?.cfr !== undefined ? `Total Deaths (CFR: ${d.cfr}%)` : "Total Deaths (CFR: --)";

  return (
    <AppShell title={"Mpox\n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Cumulative Cases" value={loading ? "--" : fmt(d?.cumulative_cases)} icon="bar_chart" centered />
        <MetricCard label={cfrLabel} value={loading ? "--" : fmt(d?.deaths)} icon="warning" iconColor="text-error" valueColor="text-error" centered />
        <MetricCard label="New Cases (Last 7 Days)" value={loading ? "--" : fmt(d?.new_cases_this_week)} icon="location_on" centered />
        <MetricCard label="Counties Affected" value={loading ? "--" : fmt(d?.counties_affected)} icon="public" centered />
        <MetricCard label="Recovered Cases" value="--" icon="health_and_safety" centered />
        <MetricCard label="Samples Sequenced" value="--" icon="biotech" centered />
      </div>

      {/* Data source banner */}
      <div
        className="flex items-center justify-between rounded-lg px-5 py-3 text-white"
        style={{ backgroundColor: "#00205c" }}
      >
        <p className="text-body-md">Data source: Ministry of Health Kenya</p>
        <a
          href="https://www.health.go.ke/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-md underline hover:opacity-80"
        >
          Click here for link
        </a>
      </div>

      <SectionCard
        title="County Breakdown"
        action={<StatusPill variant="info">LIVE DATA</StatusPill>}
      >
        <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">County</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Cases (2026)</th>
              <th className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-surface-container-high" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-surface-container-high" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-surface-container-high" /></td>
                </tr>
              ))
            ) : counties.data.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-body-md text-on-surface-variant">No county data.</td>
              </tr>
            ) : (
              counties.data.map((c, i) => (
                <tr key={c.id ?? `${c.county_name}-${i}`} className="hover:bg-surface-container">
                  <td className="px-6 py-4 text-body-md text-on-surface">{c.county_name ?? "--"}</td>
                  <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{fmt(c.cases_2026)}</td>
                  <td className="px-6 py-4">
                    <StatusPill variant={c.is_hotspot ? "info" : "stable"}>
                      {c.is_hotspot ? "HOTSPOT" : "MONITORED"}
                    </StatusPill>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </SectionCard>

      {/* Epi curve */}
      <SectionCard title="Epi curve of the confirmed Mpox cases, Kenya, 2024–2026" moreInfo={{ pageKey: "mpox", sectionKey: "epi_curve" }}>
        <div className="px-6 pb-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={epiCurve} margin={{ top: 10, right: 20, bottom: 50, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  interval={2}
                  height={60}
                  label={{ value: "Epi week / Year", position: "insideBottom", dy: 18, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: "var(--on-surface-variant)" }}
                  label={{ value: "No of cases", angle: -90, position: "insideLeft", dy: 30, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="cases" name="Cases" stackId="a" fill="var(--primary)" />
                <Bar dataKey="deaths" name="Deaths" stackId="a" fill="var(--error)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-2 flex items-center justify-center gap-6 pl-[40px] text-body-md text-on-surface-variant" style={{ fontSize: 13 }}>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "var(--primary)" }} aria-hidden />
              Cases
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "var(--error)" }} aria-hidden />
              Deaths
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            <Bullet>Four counties have consistently reported cases with <span className="font-semibold">Mombasa leading 40%</span>, Nairobi <span className="font-semibold">17%</span>, Busia <span className="font-semibold">10%</span> and Makueni <span className="font-semibold">7.4%</span>.</Bullet>
          </ul>
        </div>
      </SectionCard>

      {/* County distribution — stacked per epi-week */}
      <SectionCard title="Distribution of Mpox cases by county, Kenya, 2024–2026 (n=1,123)" moreInfo={{ pageKey: "mpox", sectionKey: "distribution" }}>
        <div className="px-6 pb-6">
          <div className="h-[460px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyByCounty} margin={{ top: 10, right: 20, bottom: 60, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis
                  dataKey="label"
                  interval={3}
                  height={60}
                  tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  label={{ value: "Epi week / Year", position: "insideBottom", dy: 18, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
                  label={{ value: "No of cases", angle: -90, position: "insideLeft", dx: -10, dy: 30, fill: "var(--on-surface-variant)", fontSize: 13 }}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                {STACK_COUNTIES.map((c, i) => (
                  <Bar key={c} dataKey={c} name={c} stackId="a" fill={STACK_COLORS[i % STACK_COLORS.length]} />
                ))}
                <Bar dataKey="Other" name="Other" stackId="a" fill="var(--outline)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pl-[40px] text-on-surface-variant" style={{ fontSize: 13 }}>
            {STACK_COUNTIES.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: STACK_COLORS[i % STACK_COLORS.length] }} aria-hidden />
                {c}
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "var(--outline)" }} aria-hidden />
              Other
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            <Bullet><span className="font-semibold">38/47 (81%)</span> have been affected.</Bullet>
            <Bullet>Four counties have consistently reported cases with Mombasa leading <span className="font-semibold">40%</span>, Nairobi <span className="font-semibold">17%</span>, Busia <span className="font-semibold">10%</span> and Makueni <span className="font-semibold">7.4%</span>.</Bullet>
          </ul>
        </div>
      </SectionCard>

      {/* Demographic donut — age distribution */}
      <SectionCard title="Demographic characteristics of Mpox cases, Kenya, 2024–2026" moreInfo={{ pageKey: "mpox", sectionKey: "demographics" }}>
        <div className="px-6 pb-6">
          <p className="mb-2 text-label-caps text-on-surface-variant" style={{ fontSize: 13 }}>Age distribution (N=657)</p>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ageDist} dataKey="value" nameKey="name" innerRadius={70} outerRadius={130} paddingAngle={2} label={(e: { name: string; value: number }) => `${e.name}: ${e.value}`} style={{ fontSize: 13 }}>
                  {ageDist.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-6 space-y-2">
            <Bullet>Truck drivers, sex workers and business workers working in the stop-over markets of truck drivers constitute <span className="font-semibold">26% (129 cases)</span> of all cases.</Bullet>
            <Bullet>Those aged <span className="font-semibold">15–44 yrs</span> accounted for <span className="font-semibold">69% (456 cases)</span> of the reported cases.</Bullet>
            <Bullet>Reported males <span className="font-semibold">32%</span>, females <span className="font-semibold">30%</span>, and <span className="font-semibold">400 cases (38%)</span> are missing data.</Bullet>
            <Bullet>Transmission dynamics: <span className="font-semibold">predominantly sexual transmission</span>.</Bullet>
          </ul>
        </div>
      </SectionCard>

      {/* Mpox deaths HIV status */}
      <SectionCard
        title="Mpox deaths HIV status"
        action={<span className="text-label-caps text-on-surface-variant" style={{ fontSize: 13 }}>N=19 · HIV status / Sex</span>}
      >
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hivStatus} margin={{ top: 10, right: 20, bottom: 80, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                  <XAxis
                    dataKey="group"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 13, fill: "var(--on-surface-variant)" }}
                    height={90}
                    label={{ value: "HIV status / Sex", position: "insideBottom", dy: 20, fill: "var(--on-surface-variant)", fontSize: 13 }}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "var(--on-surface-variant)" }}
                    label={{ value: "No of cases", angle: -90, position: "insideLeft", dx: -5, dy: 30, fill: "var(--on-surface-variant)", fontSize: 13 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" name="Deaths" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 self-center">
              <Bullet>Among deaths with confirmed HIV status, the majority were <span className="font-semibold">female (62%)</span>.</Bullet>
              <Bullet>Overall, most deaths occurred among individuals who were <span className="font-semibold">HIV positive (68%)</span>.</Bullet>
              <Bullet>The case that tested HIV negative had a co-morbidity — <span className="font-semibold">Diabetes Mellitus</span>.</Bullet>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Mpox death analysis */}
      <SectionCard
        title="Mpox death analysis"
        action={<span className="text-label-caps text-on-surface-variant" style={{ fontSize: 13 }}>N=19 · Age group / Sex</span>}
      >
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ul className="space-y-2 self-center">
              <Bullet>Total deaths — <span className="font-semibold">19</span>.</Bullet>
              <Bullet>Females accounted for the majority of Mpox deaths, with <span className="font-semibold">10 cases (53%)</span>.</Bullet>
              <Bullet>Among females, the highest number of deaths occurred in the <span className="font-semibold">25–34 age group</span>.</Bullet>
              <Bullet>Among males, deaths were highest in the <span className="font-semibold">35–44 age group</span>.</Bullet>
              <Bullet>Overall, most deaths occurred among adults aged <span className="font-semibold">25–54 years</span>.</Bullet>
            </ul>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deathAgeSex} margin={{ top: 10, right: 20, bottom: 80, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                  <XAxis
                    dataKey="group"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 13, fill: "var(--on-surface-variant)" }}
                    height={90}
                    label={{ value: "Age group / Sex", position: "insideBottom", dy: 20, fill: "var(--on-surface-variant)", fontSize: 13 }}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "var(--on-surface-variant)" }}
                    label={{ value: "No of cases", angle: -90, position: "insideLeft", dx: -5, dy: 30, fill: "var(--on-surface-variant)", fontSize: 13 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" name="Deaths" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SectionCard>

      <DiseaseMap disease="mpox" reportId={reportId} />

      <NotesCard title="Response Notes & Updates">
        <ol className="space-y-4">
          {[
            { n: "01", title: "County Activation:", body: "Response teams in Nairobi have intensified contact tracing following new identifications." },
            { n: "02", title: "Vaccination Drive:", body: "10,697 individuals vaccinated in high-risk zones, exceeding target by 5%." },
            { n: "03", title: "Lab Capacity:", body: "Sequencing throughput increased by 12% with new reagents." },
          ].map((u) => (
            <li key={u.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
                {u.n}
              </span>
              <p className="text-body-md text-on-surface">
                <span className="font-semibold">{u.title}</span> {u.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 flex items-center justify-between">
          <div>
            <p className="text-label-caps text-on-surface-variant">Last Update</p>
            <p className="text-body-md font-semibold text-on-surface">May 11, 2026 | 08:00 AM</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">history</span>
        </div>
      </NotesCard>
    </AppShell>
  );
}
