## Wire Floods page to live Supabase data

Edit only `src/routes/_authenticated/floods.tsx`. Layout, classNames, components, and copy stay unchanged.

### Data hooks
- `useLatestReportId()` → `reportId`, `weekNumber`, `loading: reportLoading`.
- `useTableData<FloodsData>("floods_data", reportId)` → single row.

`FloodsData` type fields (per project schema):
`counties_affected`, `total_deaths`, `missing_persons`,
`nairobi_deaths`, `eastern_deaths`, `rift_valley_deaths`, `nyanza_deaths`, `western_deaths`.

### Helpers
- `fmt(n)` → `"—"` for null/undefined, else `n.toLocaleString()`.

### Metric cards (top grid)
- Counties Affected → `fmt(row.counties_affected)`
- Deaths → `fmt(row.total_deaths)`
- People Affected → `"—"` (not in schema)
- Households Displaced → `"—"` (not in schema)
- Missing → `fmt(row.missing_persons)`
- Injured → `"—"` (not in schema)

All `subtext` strings under metric cards stay as-is (static copy, no schema field).

### Header chip
- Week label uses `weekNumber` when available, otherwise `"—"`. Static date range string stays (no schema field).
- "Active Outbreak: N Counties" uses `row.counties_affected`.

### Regional breakdown (right card)
Replace mock `regions` array with values derived from the row:
```
[
  { name: "Nairobi",     deaths: row.nairobi_deaths },
  { name: "Eastern",     deaths: row.eastern_deaths },
  { name: "Rift Valley", deaths: row.rift_valley_deaths },
  { name: "Nyanza",      deaths: row.nyanza_deaths },
  { name: "Western",     deaths: row.western_deaths },
]
```
- Right label changes from `"{areas} Areas"` to `"{fmt(deaths)} Deaths"` (the only schema-backed regional number is deaths; "areas" was mock).
- `ProgressBar value` = `deaths / maxDeaths * 100` (0 when max is 0 or deaths null). Same color/track/height props.
- Section header copy "Top Affected Regions" unchanged.

### Loading state
- While `reportLoading` OR (`reportId !== null && floods.loading`): render the full layout with skeleton placeholders inside metric values and progress bars (pulsing `bg-surface-container-high` blocks), preserving grid/card structure.

### Empty state
- After load with `reportId === null`: render a single `Card` with an `inbox` icon + "No weekly report uploaded yet." (matches Mpox/Measles/Anthrax pattern).
- After load with `reportId` set but row is null: metric values show `"—"` and regional bars render at 0%.

### Untouched
- `AppShell`, map `Card`, `NotesCard` and `NoteRow` content, all imports/classNames/icons.