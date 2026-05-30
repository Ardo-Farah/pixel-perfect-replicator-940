## Problem

Two gaps in the admin → user-dashboard link:

1. **Document deletion doesn't reflect on user pages.** Admin documents are the source uploads that produce `weekly_reports` + section tables, but:
   - Deleting a document only removes the storage object + `documents` row. The linked `weekly_reports` rows it produced stay behind, so the user dashboard keeps showing old data.
   - Even if the data did change, the user dashboard only re-fetches on page reload — there's no realtime subscription.
2. **Admin can't edit readable paragraphs on the user dashboard.** A `page_content` table + `/admin/content` editor already exists (Overview, Mpox, Measles, Anthrax, Floods, IDSR, Nutrition), but the user-facing pages (`/`, `/mpox`, `/measles`, etc.) still render hardcoded headings, intros, and "more info" paragraphs. Admin edits go nowhere visible.

## Plan

### 1. Cascade document delete → weekly report

In `src/lib/admin-documents.functions.ts > deleteAdminDocument`, after removing the storage object and `documents` row, also delete the matching `weekly_reports` row (and dependent section rows via existing FK cascade) when the document is linked to one. Show a confirmation in the admin Documents page that explains "this also removes the parsed weekly report from the public dashboard."

If a `documents` row carries a `week_number`, resolve the corresponding `weekly_reports.id` and delete it via `supabaseAdmin`. Audit-log the cascade.

### 2. Realtime sync across the app

Add a small hook `src/hooks/useRealtimeInvalidate.ts` that subscribes to Postgres changes for a given table and invalidates the matching React Query keys. Wire it in two places:

- **`src/routes/_authenticated.tsx`** (covers every user page): subscribe to `weekly_reports`, `report_summary`, `mpox_data`, `mpox_counties`, `mpox_demographics`, `measles_data`, `measles_counties`, `anthrax_data`, `floods_data`, `idsr_data`, `idsr_counties`, `nutrition_data`, `nutrition_counties`, and `page_content`. Invalidate `["latest-report"]`, `["weekly-reports"]`, `["table-data", …]`, `["county-data", …]`, and `["page-content", …]` on any change.
- **`src/routes/admin.tsx`** (admin shell): subscribe to `documents` + `weekly_reports` so the admin documents/reports lists self-update.

Enable realtime in a migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.weekly_reports, public.report_summary,
  public.mpox_data, public.mpox_counties, public.mpox_demographics,
  public.measles_data, public.measles_counties,
  public.anthrax_data, public.floods_data,
  public.idsr_data, public.idsr_counties,
  public.nutrition_data, public.nutrition_counties,
  public.page_content, public.documents;
```
(Use `ALTER TABLE ... REPLICA IDENTITY FULL` where needed so DELETE payloads carry the row.)

### 3. Wire `usePageContent` into user-facing pages

The hook and registry already exist. Update each page to read editable text from `page_content` with the current hardcoded copy as fallback (so nothing breaks if the admin hasn't filled it in):

- **`src/routes/_authenticated/index.tsx`** (Overview):
  - `header.title` / `header.subtitle` → AppShell title/subtitle.
  - `summary.heading` → "Current Health Emergencies".
  - `summary.description` → the intro paragraph.
  - `response_notes.more_info_md` → render a new "Response notes" card with markdown.
- **`src/routes/_authenticated/mpox.tsx`, `measles.tsx`, `anthrax.tsx`, `floods.tsx`, `idsr.tsx`, `nutrition.tsx`**: same pattern — page header, each section's heading/description, and "more info" markdown surfaced via a `MoreInfoDialog` button (component already in the repo) or an inline expandable block.

Render markdown via a small wrapper (use `react-markdown` — add dep) so admins can format paragraphs.

### 4. Small admin UX polish

- On `/admin/documents`, add a confirm dialog before delete explaining the cascade.
- On `/admin/content`, surface a "Live preview" link next to each page in the sidebar pointing to the corresponding user route.

## Files touched

- `src/lib/admin-documents.functions.ts` — cascade delete.
- `src/hooks/useRealtimeInvalidate.ts` — new.
- `src/routes/_authenticated.tsx` — mount realtime for user pages.
- `src/routes/admin.tsx` — mount realtime for admin lists.
- `src/routes/_authenticated/{index,mpox,measles,anthrax,floods,idsr,nutrition}.tsx` — read `usePageContent`.
- `src/components/Markdown.tsx` — new tiny wrapper around `react-markdown`.
- `src/routes/admin/documents.tsx` — confirm-cascade dialog.
- `src/routes/admin/content.tsx` — "Live preview" links.
- New migration to extend `supabase_realtime` publication.
- `package.json` — add `react-markdown`.

## Out of scope

- No schema changes to `page_content` or `documents` beyond enabling realtime.
- No changes to upload/parsing pipeline.
- No new auth/role logic — existing admin middleware still gates everything.
