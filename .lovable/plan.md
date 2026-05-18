I’ll fix the week selector as a platform-wide report filter and restore the top bar so it matches the wider one-line layout in your reference screenshot.

Implementation plan:

1. Make the selected week the single source of truth
- Keep `SelectedReportProvider` mounted around the authenticated app.
- Ensure `weekly_reports` are fetched with `published = true` and ordered by `week_number` descending, not by date.
- Default the selected report to the highest `week_number`.
- Keep the dropdown label derived from `reporting_date` as: `Week N: start date to end date`.

2. Wire every data page to the shared dropdown
- Replace page-local `useLatestReportId()` usage with `useSelectedReport()` across:
  - Summary
  - Mpox
  - Measles
  - Anthrax
  - Floods
  - IDSR
  - Nutrition
  - User Support, if it shows report-specific data
- Pass `selectedReportId` into each page’s `useTableData` / `useCountyData` calls.
- This means switching to Week 5 will re-fetch that week’s `report_id` data everywhere, not keep showing the latest report.

3. Fix stale latest-report logic
- Update `useLatestReportId()` to also order by `week_number` descending for any remaining fallback use.
- Update `useWeeklyReports()` to order by `week_number` descending so the dropdown order and default selection are consistent.

4. Restore the top-bar spacing
- Adjust `AppShell` header layout so the title, week dropdown, Upload button, and Download button stay on one line at the current desktop width.
- Prevent button text wrapping with `whitespace-nowrap`.
- Give the week dropdown a stable width like the reference screenshot, without forcing the upload buttons to squeeze.
- Add responsive wrapping only for smaller screens, so desktop stays clean.

5. Verify behavior
- Confirm changing the top-bar dropdown updates Summary numbers and detail-page numbers.
- Confirm the visible week label in cards matches the dropdown selection.
- Confirm the top bar visually matches the reference: no stacked Upload text and no squeezed controls.