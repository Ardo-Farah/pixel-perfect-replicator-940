## Problem

- The "Week 19: 3rd May…" pill in the topbar (`src/components/AppShell.tsx`) is hardcoded text with a fake `expand_more` icon — it is not a real dropdown.
- The Summary page (`src/routes/_authenticated/index.tsx`) uses `useLatestReportId()`, which always loads the newest published `weekly_reports` row regardless of what the user picks.
- Result: the pill shows one week, cards render another, and selecting does nothing.

## Fix

### 1. Shared "selected report" state

Add `src/context/SelectedReportProvider.tsx`:
- Loads all `weekly_reports` where `published = true`, ordered by `week_number desc` (via the existing `useWeeklyReports` hook).
- Holds `selectedReportId` in state, defaulting to the first (highest week_number) report once loaded.
- Exposes `{ reports, selectedReport, selectedReportId, setSelectedReportId, loading }` through context.

Mount the provider once in `src/routes/_authenticated.tsx` so every authenticated page (and the AppShell topbar) shares the same selection.

### 2. Real dropdown in the topbar

In `src/components/AppShell.tsx` `TopBar`:
- Replace the static `<div>` pill with a shadcn `Select` (`@/components/ui/select`).
- Options: every report from context, labeled `Week {week_number}: {formatted reporting_date}`.
  - Formatter: `formatWeekLabel(reporting_date)` → `"3rd May 2026 to 10th May 2026"` (start = reporting_date, end = reporting_date + 7 days; ordinal day + month + year).
- Trigger shows the same label for the currently selected report; placeholder `"Loading weeks…"` while loading; `"No reports"` when empty.
- `onValueChange` calls `setSelectedReportId`.
- Keep the calendar icon and existing visual styling (border, padding, surface tokens) so layout is unchanged.

### 3. Summary page reads from context

In `src/routes/_authenticated/index.tsx`:
- Drop `useLatestReportId()`; read `selectedReport`, `selectedReportId`, `loading` from `useSelectedReport()`.
- Pass `selectedReportId` into the existing `useTableData` calls for `report_summary`, `mpox_data`, `measles_data`, `floods_data` — they already re-fetch on `reportId` change, so changing the dropdown will refresh all four cards.
- The "Week N" line in the first card uses `selectedReport?.week_number`, guaranteeing it matches the dropdown.
- Empty/loading states behave as today (`reportId === null` → "No weekly report uploaded yet"; otherwise show `…` placeholders while loading).

### 4. Scope guardrails

- Do not touch other pages (Mpox, Measles, Floods, etc.) — they keep using `useLatestReportId` for now. (Optional follow-up: migrate them to the same context so the selector becomes global.)
- No schema or RLS changes.
- No layout/styling changes beyond swapping the static pill for a shadcn Select styled to match.

## Files

- New: `src/context/SelectedReportProvider.tsx`
- Edit: `src/routes/_authenticated.tsx` (wrap `<Outlet />` in provider)
- Edit: `src/components/AppShell.tsx` (real Select in TopBar)
- Edit: `src/routes/_authenticated/index.tsx` (consume context instead of `useLatestReportId`)
