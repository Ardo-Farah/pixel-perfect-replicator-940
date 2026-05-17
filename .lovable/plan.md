## Plan

Replace the contents of `src/routes/_authenticated/support.tsx` with a WHO health emergency overview. Keep the `AppShell` wrapper (sidebar + header untouched); update the title to "Summary" and subtitle to "WHO Kenya Health Emergencies".

### Data wiring
- `useLatestReportId()` → `reportId`, `weekNumber`, `loading`
- `useTableData<ReportSummary>("report_summary", reportId)`
- `useTableData<MpoxData>("mpox_data", reportId)`
- `useTableData<MeaslesData>("measles_data", reportId)`
- `useTableData<FloodsData>("floods_data", reportId)`

### Render states
1. While `reportId` is loading OR any of the four tables is loading → grid of skeleton cards (animated `bg-surface-container-high` placeholders).
2. After report lookup finishes with `reportId === null` → centered empty state card: "No weekly report uploaded yet."
3. Otherwise → header strip ("Week {weekNumber}, 2026") + 4 sections:
   - **Situation overview** (from `report_summary`): new events, outbreaks, grade 1 / 2 / 3 counts.
   - **Mpox** (from `mpox_data`): cumulative cases, new this week, deaths, CFR %, counties affected.
   - **Measles** (from `measles_data`): total, confirmed, suspected, counties affected.
   - **Floods** (from `floods_data`): counties affected, total deaths, missing persons.

   Each section = card grid of metric tiles using existing tokens (`bg-surface-container-lowest`, `text-headline-sm`, `text-on-surface-variant`, `shadow-card`, `rounded-xl`, `border-outline-variant`). Each section gets a material icon (vaccines, sick, flood, monitoring).

### Implementation notes
- Define local TS types for the four row shapes (just the columns used).
- Missing values render as "—" rather than 0 to distinguish from real zeros.
- File stays a single route module; no new components extracted.
- Only `src/routes/_authenticated/support.tsx` is modified.