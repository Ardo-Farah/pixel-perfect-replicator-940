## Plan

`src/lib/supabase.ts` already exists and points at the external project — leave it untouched.

Create **one new file**: `src/hooks/useReport.ts`, exporting three hooks.

### Hooks

**`useLatestReportId()`**
- Queries `weekly_reports` where `published = true`, orders by `reporting_date desc`, limit 1.
- Returns `{ reportId: string | null, weekNumber: number | null, loading: boolean }`.

**`useTableData<T>(table: string, reportId: string | null)`**
- When `reportId` is null → returns `{ data: null, loading: false }`.
- Otherwise queries `table` filtered by `report_id = reportId`, `.single()`.
- Returns `{ data: T | null, loading: boolean }`.

**`useCountyData<T>(table: string, reportId: string | null)`**
- When `reportId` is null → returns `{ data: [], loading: false }`.
- Otherwise queries `table` filtered by `report_id = reportId`, returns all rows.
- Returns `{ data: T[], loading: boolean }`.

### Implementation notes
- All hooks use `useEffect` + `useState`, with an `isMounted` guard to avoid setting state after unmount.
- Use the `supabase` client from `@/lib/supabase`.
- Use generic table typing via `supabase.from(table as never)` cast to keep things simple since these tables aren't in the generated types.
- Log errors via `console.error` but never throw — return empty/null state on failure.
- No other files touched.