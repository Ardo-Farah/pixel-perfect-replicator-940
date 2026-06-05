// Single source of truth for every disease/section on the dashboard.
//
// Adding a new section is meant to be a ONE-entry change here (plus a small DB
// migration for its table). This config drives:
//   - the sidebar nav            (src/components/AppShell.tsx)
//   - WHO emergency grades        (src/lib/disease-grades.ts)
//   - the choropleth map config   (src/components/DiseaseMap.tsx)
//   - the trends comparison page  (src/routes/_authenticated/trends.tsx)
//   - the overview cards + map    (src/routes/_authenticated/index.tsx)
//   - the editable Page Content   (src/lib/content-registry.ts)
//   - the generic disease page    (src/routes/_authenticated/$disease.tsx)
//
// `custom: true` diseases keep their own bespoke route file (mpox/measles/
// nutrition/idsr); they are still listed here so nav/trends/chat stay in sync.
// `custom: false` (lean) diseases are rendered by the generic /$disease route
// from an anthrax-style array table.
//
// NOTE: the Supabase Edge Functions (process-upload, chat) cannot import this
// file (separate Deno bundle). Each keeps a small parallel constant marked
// "MIRRORS src/lib/diseases.ts" — keep them aligned when editing this list.

import type { GradeKey } from "./disease-grades";

export type MarkerShape = "circle" | "triangle" | "square" | "star";
export type RampName = "blue" | "rose" | "amber" | "crimson" | "teal" | "orange";

export type DiseaseMapConfig = {
  title: string;
  table: string;
  countyField: string;
  valueField: string;
  hotspotField?: string;
  subCountyField?: string;
  unit: string;
  ramp: RampName;
};

export type DiseaseTrendConfig = {
  table: string;
  isArray?: boolean;
  metrics: { key: string; label: string }[];
};

export type DiseaseConfig = {
  key: string; // url slug, e.g. "ebola"
  label: string; // "Ebola"
  navLabel?: string; // sidebar label when different from `label`
  icon: string; // material symbol for the nav item
  enabled: boolean;
  custom: boolean; // true = bespoke route file; false = generic /$disease route
  grade?: GradeKey; // primary WHO grade colour (omit = no grade badge)
  numericGrade?: GradeKey; // optional secondary "· GRADE 3" text
  color: string; // overview marker colour
  markerShape?: MarkerShape; // overview marker shape

  // Lean (generic-page) wiring — the anthrax-style array table the page reads.
  table?: string; // e.g. "ebola_data"
  countyField?: string; // e.g. "county"
  valueField?: string; // e.g. "cases"
  deathField?: string; // e.g. "deaths"
  subCountyField?: string; // e.g. "sub_county"

  map?: DiseaseMapConfig; // choropleth config (omit = no map, e.g. idsr/nutrition)
  trend?: DiseaseTrendConfig; // trends-page metrics (omit = excluded from trends)
  intro?: { heading: string; description: string };
  source?: { label: string; url?: string };
};

const MOH = "Data source: Ministry of Health Kenya";
const MOH_URL = "https://www.health.go.ke/";

// Shared lean-table column shape (mirrors the ebola/cholera/dengue tables).
const leanWiring = (table: string) =>
  ({
    table,
    countyField: "county",
    valueField: "cases",
    deathField: "deaths",
    subCountyField: "sub_county",
  }) as const;

const leanTrend = (table: string): DiseaseTrendConfig => ({
  table,
  isArray: true,
  metrics: [
    { key: "cases", label: "Cases" },
    { key: "deaths", label: "Deaths" },
  ],
});

export const DISEASES: DiseaseConfig[] = [
  {
    key: "mpox",
    label: "Mpox",
    icon: "coronavirus",
    enabled: true,
    custom: true,
    grade: "protracted",
    numericGrade: "grade3",
    color: "#7c3aed", // violet
    markerShape: "circle",
    map: {
      title: "Map of Kenya showing counties that have reported confirmed Mpox cases, 2026",
      table: "mpox_counties",
      countyField: "county_name",
      valueField: "cases_2026",
      hotspotField: "is_hotspot",
      unit: "cases",
      ramp: "blue",
    },
    trend: {
      table: "mpox_data",
      metrics: [
        { key: "cumulative_cases", label: "Cumulative Cases" },
        { key: "new_cases_this_week", label: "New Cases (Week)" },
        { key: "deaths", label: "Deaths" },
        { key: "counties_affected", label: "Counties Affected" },
      ],
    },
  },
  {
    key: "measles",
    label: "Measles",
    icon: "emergency",
    enabled: true,
    custom: true,
    grade: "ungraded",
    color: "#059669", // emerald
    markerShape: "triangle",
    map: {
      title: "Map of Kenya showing counties that have reported confirmed Measles cases, 2026",
      table: "measles_counties",
      countyField: "county_name",
      valueField: "case_count",
      subCountyField: "sub_county",
      unit: "cases",
      ramp: "rose",
    },
    trend: {
      table: "measles_data",
      metrics: [
        { key: "total_cases", label: "Total Cases" },
        { key: "confirmed", label: "Confirmed" },
        { key: "suspected", label: "Suspected" },
        { key: "counties_affected", label: "Counties Affected" },
      ],
    },
  },
  {
    key: "ebola",
    label: "Ebola",
    navLabel: "Ebola (BVD)",
    icon: "biotech",
    enabled: true,
    custom: false,
    grade: "grade3",
    color: "#b91c1c", // crimson
    markerShape: "square",
    ...leanWiring("ebola_data"),
    map: {
      title: "Map of Kenya showing counties reporting Ebola (Bundibugyo virus) cases, 2026",
      table: "ebola_data",
      countyField: "county",
      valueField: "cases",
      subCountyField: "sub_county",
      unit: "cases",
      ramp: "crimson",
    },
    trend: leanTrend("ebola_data"),
    intro: {
      heading: "Ebola (Bundibugyo Virus Disease) Surveillance",
      description:
        "Cross-border Bundibugyo virus disease (BVD) risk monitoring and county-level case tracking.",
    },
    source: { label: MOH, url: MOH_URL },
  },
  {
    key: "cholera",
    label: "Cholera",
    icon: "water_drop",
    enabled: true,
    custom: false,
    grade: "grade2",
    color: "#0891b2", // teal
    markerShape: "circle",
    ...leanWiring("cholera_data"),
    map: {
      title: "Map of Kenya showing counties reporting Cholera cases, 2026",
      table: "cholera_data",
      countyField: "county",
      valueField: "cases",
      subCountyField: "sub_county",
      unit: "cases",
      ramp: "teal",
    },
    trend: leanTrend("cholera_data"),
    intro: {
      heading: "Cholera Surveillance",
      description: "Cholera outbreak case counts, deaths, and response by county.",
    },
    source: { label: MOH, url: MOH_URL },
  },
  {
    key: "dengue",
    label: "Dengue Fever",
    navLabel: "Dengue Fever",
    icon: "bug_report",
    enabled: true,
    custom: false,
    grade: "grade1",
    color: "#ea580c", // orange
    markerShape: "triangle",
    ...leanWiring("dengue_data"),
    map: {
      title: "Map of Kenya showing counties reporting Dengue fever cases, 2026",
      table: "dengue_data",
      countyField: "county",
      valueField: "cases",
      subCountyField: "sub_county",
      unit: "cases",
      ramp: "orange",
    },
    trend: leanTrend("dengue_data"),
    intro: {
      heading: "Dengue Fever Surveillance",
      description: "Dengue fever case counts, deaths, and vector-control response by county.",
    },
    source: { label: MOH, url: MOH_URL },
  },
  {
    key: "idsr",
    label: "IDSR",
    navLabel: "IDSR Overview",
    icon: "monitoring",
    enabled: true,
    custom: true,
    color: "#0ea5e9",
    trend: {
      table: "idsr_data",
      metrics: [
        { key: "completeness_pct", label: "Completeness %" },
        { key: "timeliness_pct", label: "Timeliness %" },
        { key: "cebs_community_signals", label: "CEBS Signals" },
      ],
    },
  },
  {
    key: "nutrition",
    label: "Nutrition",
    navLabel: "Nutrition & Food Security",
    icon: "nutrition",
    enabled: true,
    custom: true,
    grade: "grade2",
    color: "#f59e0b",
    trend: {
      table: "nutrition_data",
      metrics: [
        { key: "phase3_above", label: "Phase 3+" },
        { key: "phase4_5", label: "Phase 4-5" },
      ],
    },
  },
];

// --- Helpers ----------------------------------------------------------------

export function getDisease(key: string | undefined): DiseaseConfig | undefined {
  return DISEASES.find((d) => d.key === key);
}

export function enabledDiseases(): DiseaseConfig[] {
  return DISEASES.filter((d) => d.enabled);
}

/** Lean diseases rendered by the generic /$disease route (have an array table). */
export function leanDiseases(): DiseaseConfig[] {
  return DISEASES.filter((d) => d.enabled && !d.custom && !!d.table);
}

/** Diseases that expose a choropleth map (used to build DiseaseMap CONFIG). */
export function mappedDiseases(): DiseaseConfig[] {
  return DISEASES.filter((d) => !!d.map);
}

/** Diseases shown on the trends comparison page. */
export function trendDiseases(): DiseaseConfig[] {
  return DISEASES.filter((d) => d.enabled && !!d.trend);
}
