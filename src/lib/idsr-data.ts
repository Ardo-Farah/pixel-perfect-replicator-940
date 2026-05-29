// Live data accessors for the chat assistant tools. These query the same
// Supabase tables the dashboard reads, scoped to the latest published weekly
// report, and return the exact widget shapes the chat UI renders
// (bar_by_county / trend_line / bar_by_region / map_hint).

import type { SupabaseClient } from "@supabase/supabase-js";

export type Disease = "mpox" | "measles" | "anthrax" | "floods" | "nutrition";

export type LatestReport = { id: string; week_number: number } | null;

// Untyped client: these tables aren't in the generated Database type.
type SB = SupabaseClient;

export async function getLatestReport(sb: SB): Promise<LatestReport> {
  const { data } = await sb
    .from("weekly_reports")
    .select("id, week_number")
    .eq("published", true)
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LatestReport) ?? null;
}

// Per-disease county case sources. floods has no per-county case table.
const COUNTY_CASES: Record<
  Disease,
  { table: string; countyCol: string; valueCol: string } | null
> = {
  mpox: { table: "mpox_counties", countyCol: "county_name", valueCol: "cases_2026" },
  measles: { table: "measles_counties", countyCol: "county_name", valueCol: "case_count" },
  anthrax: { table: "anthrax_data", countyCol: "county", valueCol: "human_cases" },
  nutrition: { table: "nutrition_counties", countyCol: "county_name", valueCol: "population_affected" },
  floods: null,
};

export async function getCasesByCounty(
  sb: SB,
  reportId: string | null,
  disease: Disease,
  week: number | null,
) {
  const cfg = COUNTY_CASES[disease];
  const items: { label: string; value: number }[] = [];
  if (cfg && reportId) {
    const { data } = await sb
      .from(cfg.table)
      .select(`${cfg.countyCol}, ${cfg.valueCol}`)
      .eq("report_id", reportId);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const label = String(row[cfg.countyCol] ?? "").trim();
      const raw = Number(row[cfg.valueCol] ?? 0);
      if (label) items.push({ label, value: Number.isFinite(raw) ? raw : 0 });
    }
    items.sort((a, b) => b.value - a.value);
  }

  const total = items.reduce((s, i) => s + i.value, 0);
  const top = items[0];
  const callout = !cfg
    ? `County-level case counts aren't tracked for ${labelize(disease)}.`
    : items.length === 0
      ? `No county data found for ${labelize(disease)} in the latest report.`
      : top
        ? `${top.label} accounts for ${Math.round((top.value / Math.max(total, 1)) * 100)}% of recorded ${labelize(disease)} cases.`
        : undefined;

  return {
    type: "bar_by_county" as const,
    title: `${labelize(disease)} cases by county${week ? ` — week ${week}` : ""}`,
    items,
    callout,
  };
}

// Per-disease weekly trend metric. Single-row tables read one value per report;
// anthrax is an array table so its human_cases are summed per report.
const TREND_METRIC: Record<Disease, { table: string; col: string; aggregate?: "sum" }> = {
  mpox: { table: "mpox_data", col: "new_cases_this_week" },
  measles: { table: "measles_data", col: "total_cases" },
  floods: { table: "floods_data", col: "total_deaths" },
  nutrition: { table: "nutrition_data", col: "phase4_5" },
  anthrax: { table: "anthrax_data", col: "human_cases", aggregate: "sum" },
};

export async function getTrend(sb: SB, disease: Disease, weeks = 6) {
  const { data: reportsData } = await sb
    .from("weekly_reports")
    .select("id, week_number")
    .eq("published", true)
    .order("week_number", { ascending: false })
    .limit(weeks);

  // Newest-first from the query; reverse to chronological order for the chart.
  const reports = ((reportsData ?? []) as { id: string; week_number: number }[])
    .slice()
    .reverse();

  const cfg = TREND_METRIC[disease];
  const ids = reports.map((r) => r.id);
  const valueByReport = new Map<string, number>();
  if (ids.length) {
    const { data } = await sb.from(cfg.table).select(`report_id, ${cfg.col}`).in("report_id", ids);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const rid = String(row.report_id);
      const v = Number(row[cfg.col] ?? 0) || 0;
      if (cfg.aggregate === "sum") valueByReport.set(rid, (valueByReport.get(rid) ?? 0) + v);
      else valueByReport.set(rid, v);
    }
  }

  const series = reports.map((r) => ({ week: `W${r.week_number}`, value: valueByReport.get(r.id) ?? 0 }));
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  const callout =
    series.length === 0
      ? "No published reports available yet."
      : delta >= 0
        ? `Up ${delta}% over the period (${first} → ${last}).`
        : `Down ${Math.abs(delta)}% over the period (${first} → ${last}).`;

  return {
    type: "trend_line" as const,
    title: `${labelize(disease)} weekly trend — last ${series.length} week(s)`,
    series,
    callout,
  };
}

// Regional death columns on floods_data. Other diseases have no regional
// death breakdown in the schema.
const FLOOD_REGIONS: { col: string; label: string }[] = [
  { col: "coast_deaths", label: "Coast" },
  { col: "rift_valley_deaths", label: "Rift Valley" },
  { col: "nyanza_deaths", label: "Nyanza" },
  { col: "western_deaths", label: "Western" },
  { col: "central_deaths", label: "Central" },
  { col: "eastern_deaths", label: "Eastern" },
  { col: "north_eastern_deaths", label: "North Eastern" },
  { col: "nairobi_deaths", label: "Nairobi" },
];

export async function getDeathsByRegion(
  sb: SB,
  reportId: string | null,
  disease: Disease,
  week: number | null,
) {
  const items: { label: string; value: number }[] = [];
  if (disease === "floods" && reportId) {
    const { data } = await sb
      .from("floods_data")
      .select(FLOOD_REGIONS.map((r) => r.col).join(","))
      .eq("report_id", reportId)
      .maybeSingle();
    if (data) {
      for (const r of FLOOD_REGIONS) {
        const v = Number((data as unknown as Record<string, unknown>)[r.col] ?? 0) || 0;
        if (v > 0) items.push({ label: r.label, value: v });
      }
      items.sort((a, b) => b.value - a.value);
    }
  }

  const total = items.reduce((s, i) => s + i.value, 0);
  const callout =
    disease !== "floods"
      ? "Regional death breakdowns are only available for Floods."
      : items.length === 0
        ? "No regional deaths recorded for Floods in the latest report."
        : `Total reported deaths this week: ${total}.`;

  return {
    type: "bar_by_region" as const,
    title: `${labelize(disease)} deaths by region${week ? ` — week ${week}` : ""}`,
    items,
    callout,
  };
}

export function getMapHint(disease: Disease, area: string) {
  return {
    type: "map_hint" as const,
    title: `${labelize(disease)} map — ${area}`,
    area,
    note: `Hotspot view for ${area} is available on the ${labelize(disease)} dashboard page.`,
  };
}

function labelize(d: Disease) {
  return d.charAt(0).toUpperCase() + d.slice(1);
}
