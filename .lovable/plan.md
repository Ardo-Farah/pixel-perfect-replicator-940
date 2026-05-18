## Problem

Two separate things on the Summary page disagree:

1. **TopBar dropdown** (`src/components/AppShell.tsx`, lines 116–124) is **hardcoded static markup** — the text `"Week 19: 3rd May 2026 to 10th May 2026"` and the `expand_more` chevron are just JSX. There is no `<select>`, no state, no click handler, no query. It looks like a dropdown but isn't one.
2. **Summary cards** (`src/routes/_authenticated/index.tsx`) use `useLatestReportId()` which always picks the newest `weekly_reports` row. So cards show Week 21 (real latest) while the bar shows the hardcoded Week 19 string.

Result: mismatch + no filtering possible.

## Fix

### 1. Selected-report context
New `src/context/SelectedReportProvider.tsx`:
- Fetches `weekly_reports` where `published = true`, ordered by `week_number desc` (using the existing `useWeeklyReports` hook in `src/hooks/useReport.ts`).
- Holds `selectedReportId` state, defaulting to the first row (highest `week_number`) once data arrives.
- Exposes `{ reports, selectedReportId, selectedReport, setSelectedReportId, loading }` via `useSelectedReport()`.
- Mounted inside `_authenticated.tsx` so every authenticated page (and the `AppShell` TopBar) sees the same selection.

### 2. Real dropdown in TopBar
Replace the hardcoded bar in `AppShell.tsx` (lines 116–124) with a shadcn `Select` (already in `src/components/ui/select.tsx`) bound to `useSelectedReport()`:
- Trigger label: `Week {week_number}: {formatted reporting_date}` derived from the selected row.
- Options: one per report, same label format, ordered newest first.
- `onValueChange` calls `setSelectedReportId`.
- Keep current visual styling (calendar icon, border, padding) so layout is unchanged.

Date formatting helper: `reporting_date` (a date string) → e.g. `"3rd May 2026"`. Since `weekly_reports` only has one date per row, the label per option will be `Week N: <reporting_date>` (no "to" range — the table doesn't have an end date). I'll confirm this matches what you want; if you want a 7-day window, I'll compute `reporting_date + 7d` for display.

### 3. Summary page reads from selection
In `src/routes/_authenticated/index.tsx`:
- Replace `useLatestReportId()` with `useSelectedReport()`.
- Pass `selectedReportId` into the four existing `useTableData` calls (`report_summary`, `mpox_data`, `measles_data`, `floods_data`). The hook already re-fetches when `reportId` changes, so switching weeks re-queries automatically.
- The "Week N" label inside the page card (line 83) uses `selectedReport.week_number`, guaranteeing dropdown ↔ cards stay in sync.
- Empty state ("No weekly report uploaded yet") triggers only when `reports.length === 0` after loading.

### 4. Out of scope
- Other pages (Mpox, Measles, etc.) keep using `useLatestReportId` for now; switching them to `useSelectedReport` is a follow-up so this PR stays focused on the Summary fix. The TopBar dropdown will still appear on those pages (it lives in `AppShell`) and will update the context, but disease pages won't react until migrated. **Tell me if you want all pages migrated in the same change** — it's a small extra edit per page.

### Files touched
- `src/context/SelectedReportProvider.tsx` (new)
- `src/routes/_authenticated.tsx` (wrap children with provider)
- `src/components/AppShell.tsx` (replace static bar with Select)
- `src/routes/_authenticated/index.tsx` (use selected report instead of latest)
