import { useMemo, useState, type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/dashboard";
import { KenyaChoropleth, type CountyMarker } from "@/components/KenyaChoropleth";
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
  const summaryHeading = content.text("summary", "heading", "Overview of the Current Health Emergencies in Kenya 2026");
  const summaryDescription = content.text(
    "summary",
    "description",
    "Kenya is managing multiple concurrent public health emergencies including one protracted Grade 2 emergency (Mpox, Clade 1b), measles outbreaks in two counties, widespread flooding from the long rains, acute food insecurity and malnutrition crisis in nine arid and semi-arid land (ASAL) counties, a Grade 3 Bundibugyo Virus Disease (BVD) outbreak in the Democratic Republic of Congo and Uganda posing cross-border risk to Kenya, a cholera outbreak in Garissa County, and a newly reported dengue fever upsurge in Garissa County.",
  );
  const summary = useTableData<ReportSummary>("report_summary", reportId);
  const mpox = useTableData<MpoxData>("mpox_data", reportId);
  const measles = useTableData<MeaslesData>("measles_data", reportId);
  const anthrax = useCountyData<AnthraxRow>("anthrax_data", reportId);
  const nutritionCounties = useCountyData<{ county_name: string | null; ipc_phase: number | null }>(
    "nutrition_counties",
    reportId,
  );
  const mpoxCounties = useCountyData<{ county_name: string | null; cases_2026: number | null; is_hotspot: boolean | null }>(
    "mpox_counties",
    reportId,
  );
  const measlesCounties = useCountyData<{ county_name: string | null; case_count: number | null }>(
    "measles_counties",
    reportId,
  );
  const floodsRow = useTableData<Record<string, number | null>>("floods_data", reportId);

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
            diseaseKey="mpox"
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
            diseaseKey="measles"
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
            diseaseKey="anthrax"
            rows={[
              ["New Cases (this week)", val(fmt(0))],
              ["Cumulative Cases", val(fmt(anthraxCumulative))],
              ["Deaths", val(fmt(anthraxDeaths))],
              ["Counties Affected", val(fmt(anthraxCounties))],
            ]}
          />

        </div>
      </div>

      {/* Kenya Concurrent Issues Map */}
      <ConcurrentIssuesMap
        ipcRows={nutritionCounties.data}
        mpoxRows={mpoxCounties.data}
        measlesRows={measlesCounties.data}
        anthraxRows={aRows}
        floodsRow={floodsRow.data}
      />

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
  label, value, sub, note, grade,
}: { label: string; value: string; sub: string; note: string; grade: GradeKey }) {
  const style = GRADE_STYLES[grade];
  return (
    <Card className={`flex min-h-[140px] flex-col justify-between gap-2 border-transparent p-5 text-left text-white shadow-sm ${style.bgClass}`}>
      <p className="text-label-caps font-bold tracking-wide text-white">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-display-metric font-bold leading-none text-white">{value}</p>
        <p className="text-body-md text-white">{sub}</p>
      </div>
      <p className="text-metric-subtext italic text-white">{note}</p>
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
  title, icon, to, rows, diseaseKey,
}: { title: string; icon: string; to: string; rows: Array<[string, string]>; diseaseKey: string }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-fixed text-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
          </span>
          <h3 className="text-headline-sm text-primary">{title}</h3>
        </div>
        <GradeBadge disease={diseaseKey} />
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
  // `color` may be a Tailwind class like "bg-[#hex]" or a raw hex starting with "#".
  const swatchStyle = (c: string): CSSProperties =>
    c.startsWith("#") ? { backgroundColor: c } : {};
  const swatchClass = (c: string) => (c.startsWith("#") ? "" : c);
  return (
    <div>
      <p className="mb-2 text-label-caps font-bold text-on-surface-variant">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-body-md text-on-surface">
            <span
              className={`inline-block border border-black/10 ${it.dot ? "h-3 w-3 rounded-full" : "h-3 w-4 rounded-sm"} ${swatchClass(it.color)}`}
              style={swatchStyle(it.color)}
            />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Kenya Concurrent Issues Map (multi-view, county-level) ----

type IpcRow = { county_name: string | null; ipc_phase: number | null };
type MpoxRow = { county_name: string | null; cases_2026: number | null; is_hotspot: boolean | null };
type MeaslesRow = { county_name: string | null; case_count: number | null };
type AnthraxRowLite = { county: string | null; human_cases: number | null };
type FloodsRow = Record<string, number | null> | null;

const IPC_BUCKETS = [
  { upTo: 1.5, color: "#cdfacd" }, // Phase 1 — Minimal
  { upTo: 2.5, color: "#fae61e" }, // Phase 2 — Stressed
  { upTo: 3.5, color: "#e67800" }, // Phase 3 — Crisis
  { upTo: 4.5, color: "#c80000" }, // Phase 4 — Emergency
  { upTo: 5,   color: "#640000" }, // Phase 5 — Famine
];

// One representative county per floods region (county-level anchor for symbol overlay).
const FLOOD_REGION_ANCHOR: { col: string; label: string; county: string }[] = [
  { col: "coast_deaths",         label: "Coast",         county: "Mombasa" },
  { col: "rift_valley_deaths",   label: "Rift Valley",   county: "Nakuru" },
  { col: "nyanza_deaths",        label: "Nyanza",        county: "Kisumu" },
  { col: "western_deaths",       label: "Western",       county: "Kakamega" },
  { col: "central_deaths",       label: "Central",       county: "Nyeri" },
  { col: "eastern_deaths",       label: "Eastern",       county: "Machakos" },
  { col: "north_eastern_deaths", label: "North Eastern", county: "Garissa" },
  { col: "nairobi_deaths",       label: "Nairobi",       county: "Nairobi" },
];

const MPOX_COLOR    = "#7c3aed"; // violet
const MEASLES_COLOR = "#059669"; // emerald
const ANTHRAX_COLOR = "#b91c1c"; // crimson
const FLOODS_COLOR  = "#0ea5e9"; // sky
const IPC_STAR      = "#f59e0b"; // amber

function buildMpoxMarkers(rows: MpoxRow[]): CountyMarker[] {
  return rows
    .filter((r) => r.county_name && (r.cases_2026 ?? 0) > 0)
    .map((r) => {
      const c = r.cases_2026 ?? 0;
      const size: "sm" | "md" | "lg" = c > 50 ? "lg" : c > 10 ? "md" : "sm";
      return {
        county: r.county_name!,
        shape: "circle" as const,
        color: MPOX_COLOR,
        size,
        label: `Mpox · ${c} cases`,
      };
    });
}
function buildMeaslesMarkers(rows: MeaslesRow[]): CountyMarker[] {
  const byCounty = new Map<string, number>();
  for (const r of rows) {
    if (!r.county_name) continue;
    byCounty.set(r.county_name, (byCounty.get(r.county_name) ?? 0) + (r.case_count ?? 0));
  }
  return Array.from(byCounty.entries())
    .filter(([, v]) => v > 0)
    .map(([county, v]) => ({
      county, shape: "triangle" as const, color: MEASLES_COLOR, size: "md" as const,
      label: `Measles · ${v} cases`,
    }));
}
function buildAnthraxMarkers(rows: AnthraxRowLite[]): CountyMarker[] {
  const byCounty = new Map<string, number>();
  for (const r of rows) {
    if (!r.county) continue;
    byCounty.set(r.county, (byCounty.get(r.county) ?? 0) + (r.human_cases ?? 0));
  }
  return Array.from(byCounty.entries())
    .filter(([, v]) => v > 0)
    .map(([county, v]) => ({
      county, shape: "square" as const, color: ANTHRAX_COLOR, size: "md" as const,
      label: `Suspected anthrax · ${v} cases`,
    }));
}
function buildFloodsMarkers(row: FloodsRow): CountyMarker[] {
  if (!row) return [];
  const out: CountyMarker[] = [];
  for (const r of FLOOD_REGION_ANCHOR) {
    const v = Number(row[r.col] ?? 0) || 0;
    if (v > 0) {
      out.push({
        county: r.county, shape: "droplet", color: FLOODS_COLOR, size: "md",
        label: `${r.label} · ${v} flood deaths`,
      });
    }
  }
  return out;
}
function buildIpcStarMarkers(rows: IpcRow[]): CountyMarker[] {
  // Top 6 most stressed counties (phase 3+) shown as stars on the All view.
  return rows
    .filter((r) => r.county_name && (r.ipc_phase ?? 0) >= 3)
    .sort((a, b) => (b.ipc_phase ?? 0) - (a.ipc_phase ?? 0))
    .slice(0, 6)
    .map((r) => ({
      county: r.county_name!,
      shape: "star" as const,
      color: IPC_STAR,
      size: "md" as const,
      label: `IPC Phase ${r.ipc_phase} · ${r.county_name}`,
    }));
}

const IPC_LEGEND = [
  { color: "#640000", label: "Phase 5 — Famine" },
  { color: "#c80000", label: "Phase 4 — Emergency" },
  { color: "#e67800", label: "Phase 3 — Crisis" },
  { color: "#fae61e", label: "Phase 2 — Stressed" },
  { color: "#cdfacd", label: "Phase 1 — Minimal" },
  { color: "#f3f4f6", label: "Not Analysed" },
];

function ConcurrentIssuesMap({
  ipcRows, mpoxRows, measlesRows, anthraxRows, floodsRow,
}: {
  ipcRows: IpcRow[];
  mpoxRows: MpoxRow[];
  measlesRows: MeaslesRow[];
  anthraxRows: AnthraxRowLite[];
  floodsRow: FloodsRow;
}) {
  const ipcData = useMemo(
    () => ipcRows.map((c) => ({ county: c.county_name, value: c.ipc_phase })),
    [ipcRows],
  );
  const mpoxMarkers = useMemo(() => buildMpoxMarkers(mpoxRows), [mpoxRows]);
  const measlesMarkers = useMemo(() => buildMeaslesMarkers(measlesRows), [measlesRows]);
  const anthraxMarkers = useMemo(() => buildAnthraxMarkers(anthraxRows), [anthraxRows]);
  const floodsMarkers = useMemo(() => buildFloodsMarkers(floodsRow), [floodsRow]);
  const ipcStarMarkers = useMemo(() => buildIpcStarMarkers(ipcRows), [ipcRows]);

  type View = {
    key: string;
    title: string;
    subtitle: string;
    markers: CountyMarker[];
    legend: Array<{ color: string; label: string; dot?: boolean }>;
    detailsHref?: string;
    detailsLabel?: string;
  };

  const views: View[] = [
    {
      key: "all", title: "All Concurrent Issues",
      subtitle: "Projected IPC food insecurity with overlaid disease surveillance — April–June 2026",
      markers: [...ipcStarMarkers, ...mpoxMarkers, ...measlesMarkers, ...anthraxMarkers, ...floodsMarkers],
      legend: [
        { color: MPOX_COLOR, label: "Mpox (sized by caseload)", dot: true },
        { color: MEASLES_COLOR, label: "Measles outbreak" },
        { color: ANTHRAX_COLOR, label: "Suspected anthrax" },
        { color: FLOODS_COLOR, label: "Flood deaths (region)", dot: true },
        { color: IPC_STAR, label: "IPC Phase 3+ hotspot" },
      ],
    },
    {
      key: "mpox", title: "Mpox", subtitle: "County hotspots overlaid on IPC base.",
      markers: mpoxMarkers,
      legend: [
        { color: MPOX_COLOR, label: "Mpox cases (sized by count)", dot: true },
      ],
      detailsHref: "/mpox", detailsLabel: "View full Mpox details",
    },
    {
      key: "measles", title: "Measles", subtitle: "Outbreak-affected counties.",
      markers: measlesMarkers,
      legend: [{ color: MEASLES_COLOR, label: "Measles outbreak" }],
      detailsHref: "/measles", detailsLabel: "View full Measles details",
    },
    {
      key: "anthrax", title: "Anthrax", subtitle: "Suspected anthrax outbreaks.",
      markers: anthraxMarkers,
      legend: [{ color: ANTHRAX_COLOR, label: "Suspected anthrax" }],
      detailsHref: "/anthrax", detailsLabel: "View full Anthrax details",
    },
    {
      key: "floods", title: "Floods", subtitle: "Reported flood-related deaths by region.",
      markers: floodsMarkers,
      legend: [{ color: FLOODS_COLOR, label: "Flood deaths (region)", dot: true }],
      detailsHref: "/floods", detailsLabel: "View full Floods details",
    },
    {
      key: "ipc", title: "IPC / Nutrition", subtitle: "Projected acute food insecurity classification.",
      markers: ipcStarMarkers,
      legend: [{ color: IPC_STAR, label: "IPC Phase 3+ hotspot" }],
      detailsHref: "/nutrition", detailsLabel: "View Nutrition details",
    },
  ];

  const [i, setI] = useState(0);
  const view = views[i];
  const prev = () => setI((p) => (p - 1 + views.length) % views.length);
  const next = () => setI((p) => (p + 1) % views.length);

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-headline-sm text-primary">Kenya Concurrent Issues Map — {view.title}</h3>
          <p className="text-metric-subtext text-on-surface-variant">{view.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {view.detailsHref ? (
            <Link to={view.detailsHref} className="inline-flex items-center gap-1 text-label-caps font-semibold text-primary hover:underline">
              {view.detailsLabel}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          ) : null}
          <span className="inline-flex items-center gap-1 text-label-caps font-semibold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>public</span>
            IPC GEOSPATIAL DATA v1.06
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative">
            <KenyaChoropleth
              height={460}
              valueLabel=""
              buckets={IPC_BUCKETS}
              formatValue={(n) => `IPC Phase ${n}`}
              data={ipcData}
              markers={view.markers}
              emptyMessage="No data in the latest report."
            />
            {/* Carousel controls */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous view"
              className="absolute left-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-card hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next view"
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-card hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {views.map((v, idx) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show ${v.title}`}
                className={`h-2.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2.5 bg-outline-variant hover:bg-on-surface-variant"}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Legend title="IPC CLASSIFICATION" items={IPC_LEGEND} />
          {view.legend.length > 0 ? (
            <Legend title="DISEASE SURVEILLANCE" items={view.legend} />
          ) : null}
          <div className="rounded-md bg-secondary-fixed px-3 py-2 text-center text-label-caps font-bold text-on-secondary-container">
            PROJECTION PERIOD<br />APRIL — JUNE 2026
          </div>
        </div>
      </div>
    </Card>
  );
}
