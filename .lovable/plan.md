## Plan

Wire `src/routes/_authenticated/measles.tsx` to live Supabase data via the existing hooks. Keep the entire layout, components, and styling identical — only swap hardcoded values for live ones.

### Data
- `useLatestReportId()` → `reportId`, loading
- `useTableData<MeaslesData>("measles_data", reportId)` — headline KPIs
- `useCountyData<MeaslesCounty>("measles_counties", reportId)` — county list

### Headline KPI cards (top grid)
Map from `measles_data`:
- Total Cases ← `total_cases`
- Total Deaths ← "--" (field not in DB)
- CFR (%) ← "--" (field not in DB)
- New Cases (7 Days) ← "--" (field not in DB)
- Recovered ← "--" (field not in DB)
- Counties Affected ← `counties_affected`

`fmt(n)` helper: returns "--" for null/undefined, else `toLocaleString()`.

### Secondary metrics table → county list
Repurpose the existing "Secondary Measles Metrics" SectionCard table for the county breakdown (same 5-column structure, same styling). Per the user's instruction, columns that don't exist in `measles_counties` render "--":
- Indicator Name → `county_name`
- Metric → `case_count` (cases)
- Change → "--"
- Target Alignment → "--" (render a zero-width `ProgressBar value={0}` to keep the cell shape identical)
- Last Updated → "--"

Empty array → single row "No county data."

### States
- `reportLoading` OR (`reportId` set and either query loading) → render full layout but with skeleton placeholders inside metric cards (pulsing strip in place of value) and 5 pulsing skeleton rows in the table body.
- After loading with `reportId === null` → replace the page body with a single empty-state card: "No weekly report uploaded yet." Sidebar/header (AppShell) unchanged.

### Untouched
- NotesCard ("Clinical Response Notes") and the Geographic Map card stay exactly as-is (out of scope — no DB fields to bind).
- All component imports, classNames, and grid structure unchanged.
- Only `src/routes/_authenticated/measles.tsx` is modified.