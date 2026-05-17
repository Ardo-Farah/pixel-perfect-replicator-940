## Wire IDSR page headline KPIs + regional table to Supabase

Edit only `src/routes/_authenticated/idsr.tsx`. Charts (countyWeek18, past4Weeks, CEBS, HEBS), the Response Updates feed, and the data-source banner stay untouched — out of scope for this request.

### Hooks
- `useLatestReportId()` → `reportId`, `loading: reportLoading`
- `useTableData<IdsrData>("idsr_data", reportId)`
- `useCountyData<IdsrCounty>("idsr_counties", reportId)`

Types:
```
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
```

### Helpers
- `fmt(n)` → `"—"` if null/undefined, else `n.toLocaleString()`.
- `pct(n)` → `"—"` if null/undefined, else `${n}%`.

### Headline KPIs (top 4 MetricCards)
- Reporting Timeliness → `pct(idsr.data?.timeliness_pct)`
- Reporting Completeness → `pct(idsr.data?.completeness_pct)`
- Total Alerts Triggered → `fmt(idsr.data?.cebs_community_signals)`
- Alerts Investigated → `"—"` (no schema field)

Static `subtext` strings on each card stay (they're copy, not KPIs).

### Regional IDSR Performance table
Replace mock `regional` array with rows from `counties.data`:
- County → `c.county_name ?? "—"`
- Timeliness % → `pct(c.timeliness_pct)`, red text when `c.below_threshold === true`
- Completeness % → `pct(c.completeness_pct)`, red text when `c.below_threshold === true`
- Active Facilities → `"—"` (no schema field)
- Status → `<StatusPill variant="below-target">Below Target</StatusPill>` when `below_threshold === true`, else `<StatusPill variant="target-met">Target Met</StatusPill>`

### Loading state
While `reportLoading` OR (`reportId !== null && (idsr.loading || counties.loading))`:
- MetricCard values render `"…"`
- Table renders 4 skeleton rows (pulsing `bg-surface-container-high` blocks in each cell)

### Empty / no-data states
- After load with `reportId === null`: replace entire page body with single `Card` showing `inbox` icon + "No weekly report uploaded yet." (matches Mpox/Measles/Floods/Anthrax pattern). Wraps inside the existing `AppShell`.
- After load with `reportId` set but `counties.data` empty: table body renders a single row spanning all columns: "No county data."

### Untouched
- `AppShell`, all chart `SectionCard`s, CEBS/HEBS tables, Response Updates Card, data source banner, all imports, classNames, copy.