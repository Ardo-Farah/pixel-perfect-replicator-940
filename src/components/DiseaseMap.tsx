import { useMemo, useState } from "react";
import { Card } from "@/components/dashboard";
import { KenyaChoropleth, type Bucket, type CountyDatum } from "@/components/KenyaChoropleth";
import { useCountyData, useWeeklyReports } from "@/hooks/useReport";

// Reusable swipeable disease map — the shared template used by Mpox, Measles,
// Anthrax, and any future outbreak. Views progress per the spec:
//   1 Cumulative 2026 · 2 By county · 3 This week · 4 Sub-county · 5 Ward
// Views 1–3 use current county data; 4–5 are shells until sub-county/ward data
// is captured in uploads.

export type DiseaseKey = "mpox" | "measles" | "anthrax";

type DiseaseConfig = {
  label: string;
  title: string;
  table: string;
  countyField: string;
  valueField: string;
  hotspotField?: string;
  subCountyField?: string;
  unit: string;
  buckets: Bucket[];
  legend: { label: string; color: string }[];
  source: string;
};

// 0 / 1–5 / 5–10 / 10–50 / 50+ buckets per the spec, one hue per disease.
function ramp(colors: [string, string, string, string, string]): {
  buckets: Bucket[];
  legend: { label: string; color: string }[];
} {
  const labels = ["0", "1–5", "5–10", "10–50", "50+"];
  const ups = [0, 5, 10, 50, Infinity];
  return {
    buckets: colors.map((color, i) => ({ upTo: ups[i], color })),
    legend: colors.map((color, i) => ({ label: labels[i], color })),
  };
}

const BLUE = ramp(["#ffffff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"]);
const ROSE = ramp(["#ffffff", "#fecdd3", "#fb7185", "#e11d48", "#9f1239"]);
const AMBER = ramp(["#ffffff", "#fde68a", "#fbbf24", "#d97706", "#92400e"]);

const SOURCE = "Source: Kenya Ministry of Health / WHO weekly surveillance report";

const CONFIG: Record<DiseaseKey, DiseaseConfig> = {
  mpox: {
    label: "Mpox",
    title: "Map of Kenya showing counties that have reported confirmed Mpox cases, 2026",
    table: "mpox_counties",
    countyField: "county_name",
    valueField: "cases_2026",
    hotspotField: "is_hotspot",
    unit: "cases",
    buckets: BLUE.buckets,
    legend: BLUE.legend,
    source: SOURCE,
  },
  measles: {
    label: "Measles",
    title: "Map of Kenya showing counties that have reported confirmed Measles cases, 2026",
    table: "measles_counties",
    countyField: "county_name",
    valueField: "case_count",
    subCountyField: "sub_county",
    unit: "cases",
    buckets: ROSE.buckets,
    legend: ROSE.legend,
    source: SOURCE,
  },
  anthrax: {
    label: "Anthrax",
    title: "Map of Kenya showing counties that have reported Anthrax human cases, 2026",
    table: "anthrax_data",
    countyField: "county",
    valueField: "human_cases",
    subCountyField: "sub_county",
    unit: "human cases",
    buckets: AMBER.buckets,
    legend: AMBER.legend,
    source: SOURCE,
  },
};

const VIEWS = [
  { key: "cumulative", label: "Cumulative 2026" },
  { key: "county", label: "By county" },
  { key: "week", label: "This week" },
  { key: "subcounty", label: "Sub-county" },
  { key: "ward", label: "Ward" },
] as const;

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const norm = (s: unknown) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

type Row = Record<string, unknown>;

export function DiseaseMap({ disease, reportId }: { disease: DiseaseKey; reportId: string | null }) {
  const cfg = CONFIG[disease];
  const { reports } = useWeeklyReports();
  const [view, setView] = useState(0);

  const idx = reports.findIndex((r) => r.id === reportId);
  const weekNumber = idx >= 0 ? reports[idx].week_number : null;
  const prevReportId = idx >= 0 ? reports[idx + 1]?.id ?? null : null;

  const current = useCountyData<Row>(cfg.table, reportId);
  const previous = useCountyData<Row>(cfg.table, prevReportId);

  const cumulative: CountyDatum[] = useMemo(
    () =>
      current.data.map((r) => ({
        county: (r[cfg.countyField] as string) ?? null,
        value: num(r[cfg.valueField]),
        hotspot: cfg.hotspotField ? Boolean(r[cfg.hotspotField]) : false,
      })),
    [current.data, cfg],
  );

  const total = cumulative.reduce((s, d) => s + (d.value ?? 0), 0);
  const reporting = cumulative.filter((d) => (d.value ?? 0) > 0).length;
  const hotspots = cumulative.filter((d) => d.hotspot).length;

  const weekData: CountyDatum[] = useMemo(() => {
    const prev = new Map<string, number>();
    for (const r of previous.data) {
      const k = norm(r[cfg.countyField]);
      if (k) prev.set(k, (prev.get(k) ?? 0) + num(r[cfg.valueField]));
    }
    return current.data.map((r) => {
      const county = (r[cfg.countyField] as string) ?? null;
      const delta = num(r[cfg.valueField]) - (prev.get(norm(county)) ?? 0);
      return { county, value: Math.max(0, delta), hotspot: false };
    });
  }, [current.data, previous.data, cfg]);

  const weekTotal = weekData.reduce((s, d) => s + (d.value ?? 0), 0);

  const subRows = cfg.subCountyField
    ? current.data.filter((r) => r[cfg.subCountyField!])
    : [];

  const v = VIEWS[view].key;
  const loading = current.loading;

  const topCounties = [...cumulative].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 6);

  return (
    <Card className="p-6">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-headline-sm text-primary">{cfg.title}</h3>
          <p className="text-metric-subtext text-on-surface-variant">
            {weekNumber ? `Week ${weekNumber}, 2026` : "Latest report"} · {VIEWS[view].label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView((i) => Math.max(0, i - 1))}
            disabled={view === 0}
            aria-label="Previous view"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          <button
            onClick={() => setView((i) => Math.min(VIEWS.length - 1, i + 1))}
            disabled={view === VIEWS.length - 1}
            aria-label="Next view"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {VIEWS.map((vw, i) => (
          <button
            key={vw.key}
            onClick={() => setView(i)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              i === view
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {vw.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex h-[420px] items-center justify-center text-on-surface-variant">Loading map…</div>
          ) : v === "cumulative" || v === "county" ? (
            <KenyaChoropleth
              height={460}
              buckets={cfg.buckets}
              valueLabel={cfg.unit}
              data={cumulative}
              emptyMessage="No county case data in the latest report."
            />
          ) : v === "week" ? (
            prevReportId ? (
              <KenyaChoropleth
                height={460}
                buckets={cfg.buckets}
                valueLabel={`new ${cfg.unit}`}
                data={weekData}
                emptyMessage="No new cases recorded this week."
              />
            ) : (
              <Placeholder
                icon="history"
                text="No earlier report to compare against yet — weekly change appears once a second weekly report is published."
              />
            )
          ) : v === "subcounty" ? (
            subRows.length ? (
              <SubCountyTable rows={subRows} cfg={cfg} />
            ) : (
              <Placeholder
                icon="map"
                text={`Sub-county breakdown for ${cfg.label} isn't in the latest report yet. The map will drill to sub-county once that data is captured.`}
              />
            )
          ) : (
            <Placeholder
              icon="explore"
              text={`Ward-level ${cfg.label} data isn't available yet. This view fills in once ward data is captured in uploads.`}
            />
          )}
        </div>

        <div className="space-y-5">
          {/* Headline stat */}
          <div className="rounded-lg bg-surface-container-low p-4">
            {v === "week" ? (
              <>
                <p className="text-label-caps text-on-surface-variant">New {cfg.unit} this week</p>
                <p className="text-headline-sm font-bold text-primary">{weekTotal.toLocaleString()}</p>
              </>
            ) : (
              <>
                <p className="text-label-caps text-on-surface-variant">Cumulative {cfg.unit}, 2026</p>
                <p className="text-headline-sm font-bold text-primary">{total.toLocaleString()}</p>
                <p className="mt-1 text-metric-subtext text-on-surface-variant">
                  {reporting} {reporting === 1 ? "county" : "counties"} reporting
                  {cfg.hotspotField ? ` · ${hotspots} hotspot${hotspots === 1 ? "" : "s"}` : ""}
                </p>
              </>
            )}
          </div>

          {/* Legend */}
          <div>
            <p className="mb-2 text-label-caps text-on-surface-variant">{cfg.unit} per county</p>
            <div className="space-y-1.5">
              {cfg.legend.map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span
                    className="inline-block h-3 w-5 rounded-sm border border-outline-variant"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </div>
              ))}
              {cfg.hotspotField ? (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="inline-block h-3 w-5 rounded-sm border-2 border-rose-600" />
                  Hotspot county
                </div>
              ) : null}
            </div>
          </div>

          {/* Top counties on the "by county" view */}
          {v === "county" && topCounties.some((c) => (c.value ?? 0) > 0) ? (
            <div>
              <p className="mb-2 text-label-caps text-on-surface-variant">Top counties</p>
              <div className="space-y-1">
                {topCounties
                  .filter((c) => (c.value ?? 0) > 0)
                  .map((c) => (
                    <div key={c.county} className="flex justify-between text-xs">
                      <span className="text-on-surface">{c.county}</span>
                      <span className="font-semibold text-on-surface">{(c.value ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          <p className="text-[11px] leading-snug text-on-surface-variant">
            Status breakdown (active / recovered / not recovered) will appear here once captured in uploads.
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-outline-variant pt-3 text-[11px] text-on-surface-variant">{cfg.source}</p>
    </Card>
  );
}

function Placeholder({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex h-[460px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low/50 px-6 text-center">
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 36 }}>{icon}</span>
      <p className="max-w-sm text-metric-subtext text-on-surface-variant">{text}</p>
    </div>
  );
}

function SubCountyTable({ rows, cfg }: { rows: Row[]; cfg: DiseaseConfig }) {
  const items = rows
    .map((r) => ({
      county: String(r[cfg.countyField] ?? "—"),
      sub: String(r[cfg.subCountyField!] ?? "—"),
      value: num(r[cfg.valueField]),
    }))
    .sort((a, b) => b.value - a.value);
  return (
    <div className="h-[460px] overflow-auto rounded-lg border border-outline-variant">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th className="px-4 py-2">County</th>
            <th className="px-4 py-2">Sub-county</th>
            <th className="px-4 py-2 text-right">{cfg.unit}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {items.map((it, i) => (
            <tr key={`${it.county}-${it.sub}-${i}`}>
              <td className="px-4 py-2 font-medium text-on-surface">{it.county}</td>
              <td className="px-4 py-2 text-on-surface-variant">{it.sub}</td>
              <td className="px-4 py-2 text-right font-semibold text-on-surface">{it.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-[11px] text-on-surface-variant">
        Shown as a table until sub-county boundaries are added for the map view.
      </p>
    </div>
  );
}
