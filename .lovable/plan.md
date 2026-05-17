## Plan

Wire `src/routes/_authenticated/anthrax.tsx` to live Supabase data. Keep all layout, components, and styling — only swap hardcoded values for live ones.

### Data
- `useLatestReportId()` → `reportId`, `weekNumber`, loading
- `useCountyData<AnthraxRow>("anthrax_data", reportId)` — `anthrax_data` is array-shaped per project schema; one row per affected county/sub-county

`AnthraxRow` fields used: `county`, `sub_county`, `human_cases`, `human_deaths`, `animal_deaths`.

### Derived headline totals (top metric grid)
- Total Cases ← sum of `human_cases` across all rows
- Total Deaths ← sum of `human_deaths` across all rows
- CFR (%) ← `totalDeaths / totalCases * 100`, one decimal; "--" when totalCases is 0
- Affected Counties ← count of distinct `county` values
- New Cases (7d) → "--" (no schema field)
- Recovered → "--" (no schema field)

`fmt(n)` helper: returns "--" for null/undefined, else `toLocaleString()`.

The top date strip and "Active Outbreak" pill stay as-is structurally; the pill text becomes "Active Outbreak: {distinctCounties} Counties". Date line shows "Week {weekNumber}, 2026" when known, else keeps placeholder text.

### Secondary table → live county rows
For each row in `anthrax_data`:
- County → `county` (append `— sub_county` if present)
- Human Exposure → `human_cases`
- Livestock Loss → `animal_deaths`
- Lab Confirmation → "--" rendered via `StatusPill variant="low"` (field not in DB)
- Vaccination Status → `ProgressBar value={0}` (field not in DB)

Empty array → single row spanning all columns: "No active anthrax outbreaks reported."

### States
- Loading (`reportLoading` OR (`reportId` && `counties.loading`)) → render full layout; metric values show "--"; table body shows 5 skeleton rows with pulsing placeholders.
- After loading with `reportId === null` → page body becomes single empty-state card "No weekly report uploaded yet." Sidebar/header unchanged.
- After loading with `reportId` set and rows empty → headline totals show 0 / 0 / "--" / 0; table body shows the "No active anthrax outbreaks reported." row.

### Untouched
- Geographic map Card and NotesCard sections remain exactly as-is (no DB fields to bind).
- All component imports, classNames, grid structure, NoteRow helper unchanged.
- Only `src/routes/_authenticated/anthrax.tsx` is modified.