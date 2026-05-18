## Problem

The week selector in the top bar (`src/components/AppShell.tsx`, line 116-124) is hardcoded static markup — "Week 19: 3rd May 2026 to 10th May 2026" with no `<select>`, no state, no query. Meanwhile every page calls `useLatestReportId()` (from `src/hooks/useReport.ts`), which independently fetches the latest published report. That's why the cards show Week 21 (real latest) while the chip shows Week 19 (stale hardcoded text), and changing the chip does nothing.

## Fix

Introduce a single source of truth for "currently selected report" that the top-bar dropdown writes and every page reads.

### 1. New `ReportContext` (`src/context/ReportProvider.tsx`)

- On mount: fetch all rows from `weekly_reports` where `published = true`, ordered by `week_number desc`, selecting `id, week_number, reporting_date`.
- State: `reports: Report[]`, `selectedReportId: string | null`, `setSelectedReportId(id)`.
- Default `selectedReportId` to `reports[0].id` (highest week_number) once loaded.
- Expose `useReportContext()` hook + a `useSelectedReport()` convenience that returns `{ reportId, weekNumber, reportingDate, reports, setSelectedReportId, loading }`.
- Mount the provider inside `_authenticated` layout (`src/routes/_authenticated.tsx`) so every authenticated page shares it.

### 2. Top-bar dropdown (`AppShell.tsx`)

Replace the static `<div>…<span>Week 19…</span>…</div>` chip with a real `<select>` (styled to match the current pill: bordered, calendar icon left, chevron right via native or custom). Options come from `reports`:

```
Week {week_number}: {formatRange(reporting_date)}
```

`formatRange(reportingDate)` derives the label from `reporting_date` only — render as `{ordinal(date - 6 days)} {month} {year} to {ordinal(date)} {month} {year}` (e.g. "3rd May 2026 to 10th May 2026"). If the project later adds an explicit `period_start` column we can swap to that; for now the range is computed from `reporting_date`.

`onChange` calls `setSelectedReportId(e.target.value)`.

### 3. Rewire `useReport.ts`

- Delete the standalone Supabase call in `useLatestReportId`. Re-implement it as a thin wrapper that reads from `useReportContext()` and returns `{ reportId, weekNumber, loading }` — same shape so the 8 consumer pages keep working with zero edits.
- `useTableData` / `useCountyData` stay as-is; they already key off `reportId`, so when the context changes the selected id, every page re-fetches automatically.

### 4. Summary page (`src/routes/_authenticated/index.tsx`)

No structural change required — it already passes `reportId` into `useTableData` for `report_summary`, `mpox_data`, `measles_data`, `floods_data`. With the new context, changing the dropdown re-keys all four hooks and the KPI + disease cards refetch. The in-card "Week {n}" label (line 83) automatically matches because it comes from the same `useLatestReportId()` (now context-backed) as the dropdown.

## Files touched

- **new** `src/context/ReportProvider.tsx` — provider + hooks + week-range formatter.
- **edit** `src/routes/_authenticated.tsx` — wrap `<Outlet />` in `<ReportProvider>`.
- **edit** `src/components/AppShell.tsx` — replace static chip with `<select>` bound to context.
- **edit** `src/hooks/useReport.ts` — `useLatestReportId` reads from context (keeps existing signature so all 8 pages keep working).

## Out of scope

- No DB migration. Uses existing `weekly_reports.reporting_date` for the range label.
- No changes to other dashboard pages (mpox, measles, etc.) — they inherit the fix because they already use `useLatestReportId` + `useTableData(reportId)`.
- Renaming `useLatestReportId` → `useSelectedReport` (cosmetic; can be done in a later cleanup pass).
