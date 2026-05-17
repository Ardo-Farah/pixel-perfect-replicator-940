## Plan

Wire `src/routes/_authenticated/mpox.tsx` to live Supabase data. Keep all existing layout and styling — same `AppShell`, same grid, same `MetricCard` / `SectionCard` / `MapPlaceholder` / `NotesCard` components.

### Data
- `useLatestReportId()` → `reportId`, `loading`
- `useTableData<MpoxData>("mpox_data", reportId)` for headline metrics
- `useCountyData<MpoxCounty>("mpox_counties", reportId)` for the table

### Headline metrics (replace hardcoded strings)
Map from `mpox_data` row:
- Cumulative Cases ← `cumulative_cases`
- Total Deaths (CFR) ← `deaths`, label suffix uses `cfr` ("CFR: {cfr}%")
- New Cases (Last 7 Days) ← `new_cases_this_week`
- Counties Affected ← `counties_affected`
- Recovered Cases — not in schema → render "—"
- Samples Sequenced — not in schema → render "—"

Use a small `fmt(n)` helper that returns "—" for null/undefined, otherwise `toLocaleString()`.

### County table (replaces `otherMetrics` static array)
Swap the "Other Key Surveillance Metrics" table to show `mpox_counties` rows:
- columns: County, Cases (2026), Status
- Status pill: "HOTSPOT" (variant `info`) when `is_hotspot`, else "MONITORED" (variant `stable`)
- Empty rows array → table body shows a single row with "No county data."

Section title stays "Other Key Surveillance Metrics" to keep the layout/styling untouched per the user's instruction (only data wiring changes).

### States
- While `reportLoading` OR (`reportId` exists and any of the two queries is loading) → render the same JSX but with skeleton placeholders: metric cards show "—" with a pulsing strip, table body shows 5 pulsing rows.
- After loading, if `reportId === null` → render a single empty-state card inside `AppShell`: "No weekly report uploaded yet." Skip the rest.
- Otherwise render the full dashboard with live values.

### Untouched
- `MapPlaceholder` + `NotesCard` blocks stay exactly as-is (still placeholder/static content — outside scope).
- No styling, class, or component-structure changes.
- Only `src/routes/_authenticated/mpox.tsx` is modified.