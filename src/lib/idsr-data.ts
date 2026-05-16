// Static fixture data for the WHO Kenya IDSR demo. Used by AI assistant tools
// so it can answer questions about Mpox / Measles / Anthrax / Floods / Nutrition.

export type Disease = "mpox" | "measles" | "anthrax" | "floods" | "nutrition";

const casesByCounty: Record<Disease, { label: string; value: number }[]> = {
  mpox: [
    { label: "Nairobi", value: 312 },
    { label: "Mombasa", value: 87 },
    { label: "Kibra", value: 72 },
    { label: "Embakasi", value: 55 },
    { label: "Kisumu", value: 45 },
    { label: "Starehe", value: 41 },
    { label: "Mathare", value: 36 },
  ],
  measles: [
    { label: "Wajir", value: 124 },
    { label: "Mandera", value: 98 },
    { label: "Garissa", value: 76 },
    { label: "Turkana", value: 58 },
    { label: "Marsabit", value: 41 },
    { label: "Nairobi", value: 22 },
  ],
  anthrax: [
    { label: "Baringo", value: 18 },
    { label: "Kajiado", value: 14 },
    { label: "Narok", value: 9 },
    { label: "Samburu", value: 6 },
  ],
  floods: [
    { label: "Tana River", value: 47 },
    { label: "Garissa", value: 38 },
    { label: "Kilifi", value: 22 },
    { label: "Kwale", value: 15 },
    { label: "Nairobi", value: 12 },
  ],
  nutrition: [
    { label: "Turkana", value: 1840 },
    { label: "Marsabit", value: 1210 },
    { label: "Mandera", value: 980 },
    { label: "Wajir", value: 870 },
    { label: "Samburu", value: 610 },
  ],
};

const trends: Record<Disease, { week: string; value: number }[]> = {
  mpox: [
    { week: "W13", value: 145 },
    { week: "W14", value: 168 },
    { week: "W15", value: 201 },
    { week: "W16", value: 234 },
    { week: "W17", value: 278 },
    { week: "W18", value: 312 },
  ],
  measles: [
    { week: "W13", value: 62 },
    { week: "W14", value: 71 },
    { week: "W15", value: 88 },
    { week: "W16", value: 104 },
    { week: "W17", value: 118 },
    { week: "W18", value: 124 },
  ],
  anthrax: [
    { week: "W13", value: 4 },
    { week: "W14", value: 7 },
    { week: "W15", value: 11 },
    { week: "W16", value: 14 },
    { week: "W17", value: 16 },
    { week: "W18", value: 18 },
  ],
  floods: [
    { week: "W13", value: 6 },
    { week: "W14", value: 12 },
    { week: "W15", value: 20 },
    { week: "W16", value: 28 },
    { week: "W17", value: 39 },
    { week: "W18", value: 47 },
  ],
  nutrition: [
    { week: "W13", value: 1480 },
    { week: "W14", value: 1560 },
    { week: "W15", value: 1650 },
    { week: "W16", value: 1720 },
    { week: "W17", value: 1790 },
    { week: "W18", value: 1840 },
  ],
};

const deathsByRegion: Record<Disease, { label: string; value: number }[]> = {
  floods: [
    { label: "Coast", value: 28 },
    { label: "North Eastern", value: 21 },
    { label: "Rift Valley", value: 12 },
    { label: "Nairobi", value: 7 },
    { label: "Western", value: 4 },
  ],
  mpox: [
    { label: "Nairobi", value: 6 },
    { label: "Coast", value: 3 },
    { label: "Western", value: 2 },
  ],
  measles: [
    { label: "North Eastern", value: 9 },
    { label: "Rift Valley", value: 4 },
    { label: "Coast", value: 2 },
  ],
  anthrax: [{ label: "Rift Valley", value: 3 }],
  nutrition: [
    { label: "North Eastern", value: 14 },
    { label: "Rift Valley", value: 9 },
  ],
};

const CURRENT_WEEK = 18;
const YEAR = 2026;

export function getCasesByCounty(disease: Disease) {
  const items = casesByCounty[disease] ?? [];
  const total = items.reduce((s, i) => s + i.value, 0);
  const top = items[0];
  const callout = top
    ? `${top.label} accounts for ${Math.round((top.value / Math.max(total, 1)) * 100)}% of all new cases this week.`
    : undefined;
  return {
    type: "bar_by_county" as const,
    title: `New ${labelize(disease)} cases by county — week ${CURRENT_WEEK}, ${YEAR}`,
    items,
    callout,
  };
}

export function getTrend(disease: Disease, weeks = 6) {
  const series = trends[disease].slice(-weeks);
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  return {
    type: "trend_line" as const,
    title: `${labelize(disease)} weekly trend — last ${series.length} weeks`,
    series,
    callout: delta >= 0
      ? `Cases are up ${delta}% over the period (${first} → ${last}).`
      : `Cases are down ${Math.abs(delta)}% over the period (${first} → ${last}).`,
  };
}

export function getDeathsByRegion(disease: Disease) {
  const items = deathsByRegion[disease] ?? [];
  const total = items.reduce((s, i) => s + i.value, 0);
  return {
    type: "bar_by_region" as const,
    title: `${labelize(disease)} deaths by region — week ${CURRENT_WEEK}, ${YEAR}`,
    items,
    callout: `Total reported deaths this week: ${total}.`,
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
