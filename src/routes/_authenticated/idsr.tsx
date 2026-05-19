import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, SectionCard, StatusPill } from "@/components/dashboard";
import { useTableData, useCountyData } from "@/hooks/useReport";
import { useSelectedReport } from "@/context/SelectedReportProvider";

type IdsrData = {
  completeness_pct: number | null;
  timeliness_pct: number | null;
  cebs_community_signals: number | null;
};
type IdsrCounty = {
  id: string;
  county_name: string | null;
  completeness_pct: number | null;
  timeliness_pct: number | null;
  below_threshold: boolean | null;
};

const DASH = "—";
const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? DASH : n.toLocaleString();
const pct = (n: number | null | undefined) =>
  n === null || n === undefined ? DASH : `${n}%`;
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/idsr")({
  head: () => ({
    meta: [
      { title: "IDSR Overview — WHO Kenya" },
      { name: "description", content: "Integrated Disease Surveillance and Response performance, regional reporting timeliness, and live response updates." },
    ],
  }),
  component: IdsrPage,
});

const regional = [
  { county: "Nairobi", timeliness: "92%", completeness: "98%", facilities: 142, status: "Target Met", variant: "target-met" as const, alert: false },
  { county: "Mombasa", timeliness: "85%", completeness: "91%", facilities: 58, status: "Stable", variant: "stable" as const, alert: false },
  { county: "Turkana", timeliness: "64%", completeness: "72%", facilities: 34, status: "Below Target", variant: "below-target" as const, alert: true },
  { county: "Kisumu", timeliness: "89%", completeness: "95%", facilities: 82, status: "Target Met", variant: "target-met" as const, alert: false },
  { county: "Kiambu", timeliness: "90%", completeness: "96%", facilities: 115, status: "Target Met", variant: "target-met" as const, alert: false },
];

const updates = [
  { icon: "vaccines", iconBg: "bg-secondary-fixed text-secondary", title: "Cholera Vaccination Drive Initiated", body: "Emergency response team deployed to Garissa County following localized outbreak alerts. Targeted vaccination campaign reaching 12,000 residents.", meta: "2 hours ago • Health Emergency Program" },
  { icon: "biotech", iconBg: "bg-secondary-fixed text-secondary", title: "New Lab Capacity in Kisumu", body: "KEMRI laboratory expansion completed, reducing turnaround time for Rift Valley Fever (RVF) samples from 48h to 12h.", meta: "5 hours ago • Surveillance Strengthening" },
  { icon: "warning", iconBg: "bg-error-container text-error", title: "Reporting Delay Alert - Turkana West", body: "Connectivity issues reported in Lodwar region; mobile surveillance kits being distributed to ensure data continuity.", meta: "1 day ago • Technical Support" },
  { icon: "psychology", iconBg: "bg-secondary-fixed text-secondary", title: "Quarterly Surveillance Training", body: "County Health Management Teams (CHMTs) from 47 counties have completed the Q2 IDSR refresher training.", meta: "2 days ago • Capacity Building" },
];

// Week 18 reporting rate & on-time per county (overview key indicators chart)
const countyWeek18 = [
  { county: "Baringo", rate: 78, onTime: 78 },
  { county: "Bomet", rate: 87, onTime: 87 },
  { county: "Bungoma", rate: 87, onTime: 87 },
  { county: "Busia", rate: 59, onTime: 59 },
  { county: "Elgeyo Marakwet", rate: 84, onTime: 80 },
  { county: "Embu", rate: 100, onTime: 100 },
  { county: "Garissa", rate: 83, onTime: 83 },
  { county: "Homa Bay", rate: 98, onTime: 98 },
  { county: "Isiolo", rate: 48, onTime: 48 },
  { county: "Kajiado", rate: 47, onTime: 46 },
  { county: "Kakamega", rate: 100, onTime: 100 },
  { county: "Kericho", rate: 99, onTime: 99 },
  { county: "Kiambu", rate: 95, onTime: 95 },
  { county: "Kilifi", rate: 94, onTime: 94 },
  { county: "Kirinyaga", rate: 100, onTime: 100 },
  { county: "Kisii", rate: 88, onTime: 88 },
  { county: "Kisumu", rate: 85, onTime: 85 },
  { county: "Kitui", rate: 97, onTime: 97 },
  { county: "Kwale", rate: 80, onTime: 80 },
  { county: "Laikipia", rate: 75, onTime: 75 },
  { county: "Lamu", rate: 98, onTime: 98 },
  { county: "Machakos", rate: 89, onTime: 89 },
  { county: "Makueni", rate: 99, onTime: 99 },
  { county: "Mandera", rate: 73, onTime: 73 },
  { county: "Marsabit", rate: 0, onTime: 0 },
  { county: "Meru", rate: 95, onTime: 95 },
  { county: "Migori", rate: 69, onTime: 69 },
  { county: "Mombasa", rate: 65, onTime: 65 },
  { county: "Muranga", rate: 90, onTime: 90 },
  { county: "Nairobi", rate: 76, onTime: 76 },
  { county: "Nakuru", rate: 79, onTime: 79 },
  { county: "Nandi", rate: 63, onTime: 63 },
  { county: "Narok", rate: 44, onTime: 44 },
  { county: "Nyamira", rate: 71, onTime: 71 },
  { county: "Nyandarua", rate: 100, onTime: 100 },
  { county: "Nyeri", rate: 100, onTime: 100 },
  { county: "Samburu", rate: 100, onTime: 100 },
  { county: "Siaya", rate: 83, onTime: 83 },
  { county: "Taita Taveta", rate: 100, onTime: 100 },
  { county: "Tana River", rate: 73, onTime: 73 },
  { county: "Tharaka Nithi", rate: 83, onTime: 83 },
  { county: "Trans Nzoia", rate: 68, onTime: 68 },
  { county: "Turkana", rate: 92, onTime: 92 },
  { county: "Uasin Gishu", rate: 99, onTime: 99 },
  { county: "Vihiga", rate: 97, onTime: 97 },
  { county: "Wajir", rate: 79, onTime: 79 },
  { county: "West Pokot", rate: 96, onTime: 96 },
];

// Week 17 vs Week 18 percentage reporting per county
const countyWeek17v18 = countyWeek18.map((c) => ({
  county: c.county,
  week17: Math.max(0, Math.min(100, c.rate + (c.county === "Marsabit" ? 73 : [-6, -3, 0, 3, 6][c.county.length % 5]))),
  week18: c.rate,
}));

// Reporting rate past 4 weeks per county (subset)
const past4Weeks = [
  { county: "Baringo", w15: 82, w16: 84, w17: 80, w18: 78 },
  { county: "Busia", w15: 71, w16: 65, w17: 62, w18: 59 },
  { county: "Isiolo", w15: 65, w16: 60, w17: 52, w18: 48 },
  { county: "Kajiado", w15: 58, w16: 54, w17: 49, w18: 47 },
  { county: "Kilifi", w15: 88, w16: 90, w17: 91, w18: 94 },
  { county: "Laikipia", w15: 78, w16: 76, w17: 74, w18: 75 },
  { county: "Mandera", w15: 80, w16: 78, w17: 75, w18: 73 },
  { county: "Marsabit", w15: 65, w16: 50, w17: 40, w18: 0 },
  { county: "Migori", w15: 78, w16: 74, w17: 71, w18: 69 },
  { county: "Mombasa", w15: 72, w16: 70, w17: 68, w18: 65 },
  { county: "Nairobi", w15: 82, w16: 80, w17: 78, w18: 76 },
  { county: "Nandi", w15: 70, w16: 67, w17: 65, w18: 63 },
  { county: "Narok", w15: 55, w16: 50, w17: 47, w18: 44 },
  { county: "Nyamira", w15: 78, w16: 75, w17: 73, w18: 71 },
  { county: "Samburu", w15: 92, w16: 95, w17: 98, w18: 100 },
  { county: "Tana River", w15: 80, w16: 77, w17: 74, w18: 73 },
  { county: "Trans Nzoia", w15: 75, w16: 72, w17: 70, w18: 68 },
];

// Event Based Surveillance (CEBS) data
type CebsRow = {
  county: string;
  reported: number;
  verified: number;
  pVerified: number;
  verifiedTrue: number;
  pVerifiedTrue: number;
  investigated: number;
  pInvestigated: number;
  responded: number;
  pResponded: number;
  escalated: number;
  pEscalated: number | null;
};
const cebs: CebsRow[] = [
  { county: "Nakuru", reported: 102, verified: 92, pVerified: 90, verifiedTrue: 36, pVerifiedTrue: 39, investigated: 36, pInvestigated: 100, responded: 36, pResponded: 100, escalated: 1, pEscalated: 3 },
  { county: "Meru", reported: 249, verified: 192, pVerified: 77, verifiedTrue: 106, pVerifiedTrue: 55, investigated: 62, pInvestigated: 58, responded: 62, pResponded: 100, escalated: 0, pEscalated: null },
  { county: "Busia", reported: 53, verified: 23, pVerified: 43, verifiedTrue: 6, pVerifiedTrue: 26, investigated: 4, pInvestigated: 67, responded: 4, pResponded: 100, escalated: 2, pEscalated: 50 },
  { county: "Siaya", reported: 95, verified: 82, pVerified: 86, verifiedTrue: 17, pVerifiedTrue: 21, investigated: 13, pInvestigated: 76, responded: 13, pResponded: 100, escalated: 1, pEscalated: 8 },
  { county: "Mombasa", reported: 40, verified: 13, pVerified: 33, verifiedTrue: 10, pVerifiedTrue: 77, investigated: 6, pInvestigated: 0, responded: 6, pResponded: 100, escalated: 0, pEscalated: null },
  { county: "Baringo", reported: 125, verified: 99, pVerified: 79, verifiedTrue: 10, pVerifiedTrue: 10, investigated: 9, pInvestigated: 0, responded: 9, pResponded: 100, escalated: 0, pEscalated: null },
  { county: "Nairobi", reported: 414, verified: 269, pVerified: 65, verifiedTrue: 23, pVerifiedTrue: 9, investigated: 20, pInvestigated: 0, responded: 19, pResponded: 95, escalated: 0, pEscalated: null },
  { county: "Kajiado", reported: 239, verified: 187, pVerified: 78, verifiedTrue: 43, pVerifiedTrue: 23, investigated: 1, pInvestigated: 0, responded: 0, pResponded: 0, escalated: 0, pEscalated: null },
];
const cebsTotal = {
  reported: 1317,
  verified: 957,
  verifiedTrue: 251,
  investigated: 151,
  responded: 149,
  escalated: 4,
};

// Hospital Event Based Surveillance (HEBS)
type HebsRow = {
  county: string;
  reported: number;
  verified: number;
  pVerified: number | null;
  verifiedTrue: number;
  pVerifiedTrue: number | null;
  investigated: number;
  pInvestigated: number | null;
  responded: number;
  pResponded: number | null;
  escalated: number;
  pEscalated: number | null;
};
const hebs: HebsRow[] = [
  { county: "Mombasa", reported: 31, verified: 31, pVerified: 100, verifiedTrue: 11, pVerifiedTrue: 35, investigated: 10, pInvestigated: 91, responded: 10, pResponded: 100, escalated: 0, pEscalated: null },
  { county: "Nairobi", reported: 5, verified: 4, pVerified: 80, verifiedTrue: 1, pVerifiedTrue: 25, investigated: 0, pInvestigated: 0, responded: 0, pResponded: null, escalated: 0, pEscalated: null },
  { county: "Meru", reported: 1, verified: 1, pVerified: 100, verifiedTrue: 1, pVerifiedTrue: 100, investigated: 1, pInvestigated: 100, responded: 1, pResponded: 100, escalated: 0, pEscalated: null },
  { county: "Nakuru", reported: 0, verified: 0, pVerified: null, verifiedTrue: 0, pVerifiedTrue: null, investigated: 0, pInvestigated: null, responded: 0, pResponded: null, escalated: 0, pEscalated: null },
  { county: "Siaya", reported: 1, verified: 0, pVerified: 0, verifiedTrue: 0, pVerifiedTrue: null, investigated: 0, pInvestigated: null, responded: 0, pResponded: null, escalated: 0, pEscalated: null },
  { county: "Baringo", reported: 2, verified: 2, pVerified: 100, verifiedTrue: 0, pVerifiedTrue: null, investigated: 0, pInvestigated: null, responded: 0, pResponded: null, escalated: 0, pEscalated: null },
  { county: "Kajiado", reported: 0, verified: 0, pVerified: null, verifiedTrue: 0, pVerifiedTrue: null, investigated: 0, pInvestigated: null, responded: 0, pResponded: null, escalated: 0, pEscalated: null },
];
const hebsTotal = { reported: 40, verified: 38, verifiedTrue: 13, investigated: 11, responded: 11, escalated: 0 };

function pctCell(value: number | null) {
  if (value === null) return <span className="text-on-surface-variant">—</span>;
  const low = value < 80;
  return (
    <span
      className={`inline-block min-w-[44px] rounded px-2 py-0.5 text-center text-body-md font-semibold ${
        low ? "bg-error-container text-on-error-container" : "text-on-surface"
      }`}
    >
      {value}%
    </span>
  );
}

function IdsrPage() {
  const { selectedReportId: reportId, loading: reportLoading } = useSelectedReport();
  const idsr = useTableData<IdsrData>("idsr_data", reportId);
  const counties = useCountyData<IdsrCounty>("idsr_counties", reportId);

  const loading = reportLoading || (reportId !== null && (idsr.loading || counties.loading));

  if (!loading && reportId === null) {
    return (
      <AppShell title={"IDSR Overview\n"} subtitle="UPDATES">
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <p className="text-body-md text-on-surface-variant">No weekly report uploaded yet.</p>
        </Card>
      </AppShell>
    );
  }

  const d = idsr.data;
  const rows = counties.data;

  const Skel = ({ w = "w-16" }: { w?: string }) => (
    <span className={`inline-block h-5 ${w} animate-pulse rounded bg-surface-container-high align-middle`} />
  );

  return (
    <AppShell title={"IDSR Overview\n"} subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Reporting Timeliness" value={loading ? "…" : pct(d?.timeliness_pct)} icon="schedule" subtext="↗ +2.4% from last month" subtextColor="text-secondary" centered />
        <MetricCard label="Reporting Completeness" value={loading ? "…" : pct(d?.completeness_pct)} icon="task_alt" subtext="Consistency rating: High" centered />
        <MetricCard label="Total Alerts Triggered" value={loading ? "…" : fmt(d?.cebs_community_signals)} icon="warning" iconColor="text-error" subtext="⚠ 12 critical alerts pending" subtextColor="text-error" centered />
        <MetricCard label="Alerts Investigated" value={DASH} icon="verified" subtext="All triggers fully reviewed" subtextColor="text-secondary" centered />
      </div>

      {/* Data source banner */}
      <div className="flex items-center gap-3 rounded-lg bg-secondary-fixed px-5 py-3 text-on-secondary-container">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>database</span>
        <p className="flex items-center gap-3 rounded-lg bg-secondary-fixed px-5 py-3 text-on-secondary-container border-slate-100">Data source: Weekly IDSR reports, KHIS</p>
      </div>

      <SectionCard
        title="Regional IDSR Performance"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["County", "Timeliness %", "Completeness %", "Active Facilities", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skel w="w-24" /></td>
                  <td className="px-6 py-4"><Skel w="w-12" /></td>
                  <td className="px-6 py-4"><Skel w="w-12" /></td>
                  <td className="px-6 py-4"><Skel w="w-10" /></td>
                  <td className="px-6 py-4"><Skel w="w-20" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-body-md text-on-surface-variant">No county data.</td>
              </tr>
            ) : (
              rows.map((c) => {
                const alert = c.below_threshold === true;
                return (
                  <tr key={c.id} className="hover:bg-surface-container">
                    <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{c.county_name ?? DASH}</td>
                    <td className={`px-6 py-4 text-body-md font-semibold ${alert ? "text-error" : "text-on-surface"}`}>{pct(c.timeliness_pct)}</td>
                    <td className={`px-6 py-4 text-body-md font-semibold ${alert ? "text-error" : "text-on-surface"}`}>{pct(c.completeness_pct)}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{DASH}</td>
                    <td className="px-6 py-4">
                      {alert ? (
                        <StatusPill variant="below-target">Below Target</StatusPill>
                      ) : (
                        <StatusPill variant="target-met">Target Met</StatusPill>
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

      <div className="grid grid-cols-1 gap-6">

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-sm text-primary">IDSR Response Updates</h3>
            <StatusPill variant="live">LIVE</StatusPill>
          </div>
          <ul className="space-y-5">
            {updates.map((u) => (
              <li key={u.title} className="flex gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${u.iconBg}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{u.icon}</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{u.title}</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">{u.body}</p>
                  <p className="mt-1 text-metric-subtext text-secondary">{u.meta}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full rounded-lg bg-surface-container-high py-3 text-body-md font-semibold text-on-surface hover:bg-surface-container-highest">
            View Historical Log
          </button>
        </Card>
      </div>

      {/* 4. Overview of key indicators */}
      <SectionCard
        title="Overview of key indicators of IDSR, Kenya from Epi week 1–18, 2026"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <div className="px-6 pb-6">
          <ul className="mb-4 space-y-2">
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Completeness averaged <span className="font-semibold">86%</span> and timeliness <span className="font-semibold">84%</span> for Epi weeks 1–18, above the recommended 80% threshold.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Epi week 9 recorded the lowest timeliness at <span className="font-semibold">76%</span>.</span></li>
          </ul>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countyWeek18} margin={{ top: 10, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis dataKey="county" angle={-60} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }} height={90} />
                <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <ReferenceLine y={80} stroke="var(--error)" strokeWidth={2} label={{ value: "80% target", position: "insideTopRight", fill: "var(--error)", fontSize: 11 }} />
                <Bar dataKey="rate" name="Week 18 Reporting rate" fill="var(--primary)" />
                <Bar dataKey="onTime" name="Week 18 Reporting on time" fill="var(--tertiary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* 5. Completeness and timeliness per county - line chart */}
      <SectionCard
        title="IDSR Completeness and timeliness per county, Kenya, Epi week 18, 2026"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <div className="px-6 pb-6">
          <ul className="mb-4 space-y-2">
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Counties reported below the 80% threshold: Baringo, Busia, Isiolo, Kajiado, Kilifi, Laikipia, Mandera, Marsabit, Migori, Mombasa, Nairobi, Nandi, Narok, Nyamira, Samburu, Tana River and Trans Nzoia.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Of these, Busia, Kajiado, Laikipia, Marsabit, Migori, Mombasa, Nairobi, Narok and Samburu have reported below threshold for two consecutive weeks (Epi weeks 17 and 18).</span></li>
          </ul>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={countyWeek17v18} margin={{ top: 10, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis dataKey="county" angle={-60} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }} height={90} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <ReferenceLine y={80} stroke="var(--error)" strokeWidth={2} label={{ value: "Expected threshold", position: "insideTopRight", fill: "var(--error)", fontSize: 11 }} />
                <Line type="monotone" dataKey="week17" name="Week 17" stroke="var(--secondary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="week18" name="Week 18" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* 6. Reporting rate past 4 weeks - table */}
      <SectionCard
        title="Reporting rate per County in the past 4 weeks — Epi week 17 and 18, 2026, Kenya"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <div className="px-6 pb-2 pt-0">
          <ul className="mb-4 space-y-2">
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Even with overall completeness over 80%, Kajiado, Marsabit and Narok consistently reported low in the last two weeks.</span></li>
          </ul>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {["County", "Week 15", "Week 16", "Week 17", "Week 18"].map((h) => (
                  <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {past4Weeks.map((r) => (
                <tr key={r.county} className="hover:bg-surface-container">
                  <td className="px-6 py-3 text-body-md font-semibold text-on-surface">{r.county}</td>
                  {[r.w15, r.w16, r.w17, r.w18].map((v, i) => (
                    <td key={i} className="px-6 py-3">
                      <span className={`text-body-md font-semibold ${v < 80 ? "text-error" : "text-on-surface"}`}>{v}%</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 7. Event Based Surveillance (CEBS) */}
      <SectionCard
        title="Event based surveillance, Kenya — CEBS 13th to 19th April"
        action={
          <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
            View Detailed Report
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {[
                  "County",
                  "Signals Reported",
                  "Signals Verified",
                  "% Verified",
                  "Verified True",
                  "% Verified True",
                  "Events Investigated",
                  "% Investigated",
                  "Events Responded",
                  "% Responded",
                  "Events Escalated",
                  "% Escalated",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-table-header text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {cebs.map((r) => (
                <tr key={r.county} className="hover:bg-surface-container">
                  <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{r.county}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.reported}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.verified}</td>
                  <td className="px-4 py-3">{pctCell(r.pVerified)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.verifiedTrue}</td>
                  <td className="px-4 py-3">{pctCell(r.pVerifiedTrue)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.investigated}</td>
                  <td className="px-4 py-3">{pctCell(r.pInvestigated)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.responded}</td>
                  <td className="px-4 py-3">{pctCell(r.pResponded)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.escalated}</td>
                  <td className="px-4 py-3">{pctCell(r.pEscalated)}</td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-semibold">
                <td className="px-4 py-3 text-body-md text-primary">Total</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.reported}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.verified}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.verifiedTrue}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.investigated}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.responded}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{cebsTotal.escalated}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="space-y-2 px-6 py-5">
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Nairobi County reported most of the signals (414).</span></li>
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of signal verification: Siaya County hit the 80% target.</span></li>
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of event investigation: None of the counties hit the target.</span></li>
        </ul>
      </SectionCard>

      {/* 8. Hospital Event Based Surveillance (HEBS) */}
      <SectionCard title="Hospital Event-based surveillance — Kenya HEBS 13th to 19th April">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {[
                  "County",
                  "Signals Reported",
                  "Signals Verified",
                  "% Verified",
                  "Verified True",
                  "% Verified True",
                  "Events Investigated",
                  "% Investigated",
                  "Events Responded",
                  "% Responded",
                  "Events Escalated",
                  "% Escalated",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-table-header text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {hebs.map((r) => (
                <tr key={r.county} className="hover:bg-surface-container">
                  <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{r.county}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.reported}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.verified}</td>
                  <td className="px-4 py-3">{pctCell(r.pVerified)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.verifiedTrue}</td>
                  <td className="px-4 py-3">{pctCell(r.pVerifiedTrue)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.investigated}</td>
                  <td className="px-4 py-3">{pctCell(r.pInvestigated)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.responded}</td>
                  <td className="px-4 py-3">{pctCell(r.pResponded)}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{r.escalated}</td>
                  <td className="px-4 py-3">{pctCell(r.pEscalated)}</td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-semibold">
                <td className="px-4 py-3 text-body-md text-primary">Total</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.reported}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.verified}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.verifiedTrue}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.investigated}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.responded}</td>
                <td />
                <td className="px-4 py-3 text-body-md text-on-surface">{hebsTotal.escalated}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="space-y-2 px-10 py-5">
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Mombasa HCWs reported most of the signals (31).</span></li>
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of signal verification: All signals verified except the one in Siaya.</span></li>
          <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of events investigation: Nairobi didn't hit the target.</span></li>
        </ul>
      </SectionCard>
    </AppShell>
  );
}
