## Verify Documents section

1. Refresh `/admin/documents` — it should load with an empty state (no rows yet).
2. Test upload: click upload, pick a small PDF/PPTX, confirm:
   - File appears in the list
   - Download link works
   - Delete removes both the DB row and the file from the `weekly-uploads` bucket
3. If upload fails with a bucket error, confirm the `weekly-uploads` bucket exists in the external Supabase project (`xewepnpqhwxsqiqhbfyr`). Create it as a private bucket if missing.

## Next: Logs section

Wire `/admin/logs` to the live `audit_log` table:

- New server function `listAdminLogs` in `src/lib/admin-logs.functions.ts` (admin-only, reads `audit_log` ordered by `created_at desc`, joins with `auth.admin.listUsers()` to resolve actor email).
- Refactor `src/routes/admin/logs.tsx` to use `useServerFn` + React Query.
- Filters: search (action/target), action-type dropdown, date range.
- Columns: When, Actor, Action, Target type, Target id, Metadata (expandable).
- Read-only (no mutations).

Say **go** to proceed with Logs, or tell me if Documents needs fixes first.