## Why deletions aren't reflecting

There are two separate problems behind the screenshot:

1. **Wrong table is being deleted.** The week dropdown is populated from the `weekly_reports` table (via `useWeeklyReports` → `SelectedReportProvider`). `deleteAdminDocument` (src/lib/admin-documents.functions.ts:203) only deletes the storage object and the `documents` row. The `weekly_reports` row that the upload originally produced — together with all its disease data (`mpox_data`, `measles_data`, `floods_data`, etc.) — stays behind, so the week keeps showing in the selector.

2. **Realtime was enabled on the wrong project.** The app's data Supabase client (`src/lib/supabase.ts`) targets the external project `xewepnpqhwxsqiqhbfyr`. Last turn's migration added `documents` / `page_content` to `supabase_realtime` on the Lovable Cloud project (`ouzbtusvcbegpbdrfkhs`) instead, so the realtime invalidation hook never receives events. Even when we cascade the delete, the dropdown won't refresh live without this fix.

## Plan

### 1. Cascade delete in `deleteAdminDocument`
Edit `src/lib/admin-documents.functions.ts`:
- Before removing the storage object, look up the document row by `storage_path` to get its `week_number` and `uploaded_by`.
- Find the matching `weekly_reports` row (`week_number = doc.week_number`, most recent if multiple).
- If found, delete child rows first (in this order, ignoring "not found"): `report_summary`, `mpox_data`, `mpox_counties`, `mpox_demographics`, `measles_data`, `measles_counties`, `anthrax_data`, `floods_data`, `idsr_data`, `idsr_counties`, `nutrition_data`, `nutrition_counties`, `weather_data` — all by `report_id = weekly_report.id`. Then delete the `weekly_reports` row itself.
- Then delete the storage object and the `documents` row (existing behavior).
- Keep the audit log entry; add `metadata: { week_number, deleted_report_id }`.

### 2. Enable realtime on the external project
The Lovable migration tool only reaches the Cloud project. Use a one-time bootstrap server function (`src/lib/admin-bootstrap.functions.ts`, admin-only, idempotent) that runs against `supabaseAdmin` (external project) and executes:
```sql
ALTER TABLE public.weekly_reports REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.weekly_reports, public.documents, public.report_summary,
  public.mpox_data, public.measles_data, public.anthrax_data,
  public.floods_data, public.idsr_data, public.nutrition_data,
  public.page_content;
```
Wire a hidden "Enable live updates" button on `/admin` (or auto-call once per admin session, stored in localStorage) that invokes it. Errors for "already member of publication" are swallowed.

### 3. Extend the realtime invalidate hook
Update `src/hooks/useRealtimeInvalidate.ts` to also subscribe to `weekly_reports` and invalidate the `["weekly-reports"]` and `["latest-report"]` query keys, so the week dropdown updates instantly after a cascade delete.

### 4. Admin UX
On `/admin/documents`, change the delete confirmation to: "This will remove the document **and the Week N report it generated, including all disease data**. Continue?" so admins understand the scope.

## Out of scope
- No schema changes (no new FKs, no triggers) — the cascade is done in application code because we can't run migrations against the external project from here.
- No changes to upload/parsing.
- No new auth/role logic.

## Files touched
- `src/lib/admin-documents.functions.ts` (cascade delete)
- `src/lib/admin-bootstrap.functions.ts` (new, idempotent realtime bootstrap)
- `src/routes/admin.tsx` or `src/components/AdminShell.tsx` (one-shot bootstrap call)
- `src/hooks/useRealtimeInvalidate.ts` (add weekly_reports + summary tables)
- `src/routes/admin/documents.tsx` (updated confirm dialog)
