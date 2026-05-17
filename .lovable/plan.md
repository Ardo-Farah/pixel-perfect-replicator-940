## Wire Nutrition page to live Supabase data

Edit only `src/routes/_authenticated/nutrition.tsx`. Layout/grid/Card/ProgressBar/NotesCard structure stays unchanged.

### Hooks
- `useLatestReportId()` → `reportId`, `loading: reportLoading`
- `useTableData<NutritionData>("nutrition_data", reportId)`
- `useCountyData<NutritionCounty>("nutrition_counties", reportId)`

Types:
```
type NutritionData = {
  phase3_above: number | null;
  phase4_5: number | null;
};
type NutritionCounty = {
  id: string;
  county_name: string | null;
  ipc_phase: number | null;
  projected_phase: number | null;
  population_affected: number | null;
};
```

### Helpers
- `fmt(n)` → `"—"` if null/undefined, else `n.toLocaleString()`.
- `phaseColor(p)` → bg/text classes mapping:
  - 1 → `bg-emerald-500 text-white`
  - 2 → `bg-yellow-400 text-black`
  - 3 → `bg-orange-500 text-white`
  - 4 → `bg-red-500 text-white`
  - 5 → `bg-red-900 text-white`
  - null/other → `bg-surface-container-high text-on-surface-variant`
- `PhaseBadge({ phase })` → small rounded pill rendering `Phase {phase ?? "—"}` with `phaseColor` classes.

### Top headline cards (4-card grid)
- Card 1 "People Facing IPC Phase 3 or Above (ASAL)" → value `fmt(d?.phase3_above)`; "21% of the population" chip and 21% ProgressBar replaced with `"—"` chip + ProgressBar value `0` (no schema source).
- Card 2 "People In Emergency (Phase 4) in ASAL" → value `fmt(d?.phase4_5)`; static "SEVERE URGENCY" label stays.
- Card 3 "People in Crisis (Phase 3) in ASAL" → value `"—"` (no schema field); static label stays.
- Card 4 "People Stressed (Phase 2) in ASAL" → value `"—"` (no schema field); static label stays.

### Detailed Demographic Breakdowns (replace mock `breakdown` array)
Render one Card per row in `counties.data`, reusing the existing Card markup:
- Top-left value → `fmt(c.population_affected)`
- Top-right side → `<PhaseBadge phase={c.ipc_phase} />` (current IPC, color-coded)
- Label → `c.county_name ?? "—"`
- Footer left `footLabel` → `"Projected"`
- Footer right (replaces `footValue` text) → `<PhaseBadge phase={c.projected_phase} />`
- Drop the `sub`/`footColor` mock variations.

Empty list → single Card spanning the row: "No county breakdown."

### Loading state
While `reportLoading` OR (`reportId !== null && (nutrition.loading || counties.loading))`:
- Headline card values render `"…"`; ProgressBar at 0.
- Breakdown grid renders 6 skeleton Cards (pulsing `bg-surface-container-high` blocks where value/badge/label would be).

### Empty state
After load with `reportId === null`: replace entire body with a single `Card` showing `inbox` icon + "No weekly report uploaded yet.", inside the existing `AppShell`.

### Untouched
- `AppShell`, `NotesCard` and all NoteItem content, footer bar, all classNames, all imports for `Card`/`NotesCard`/`ProgressBar`.