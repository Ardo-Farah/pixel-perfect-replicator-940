## Wire Upload PPTX / PDF button to process-upload Edge Function

### 1. Migration — create `weekly-uploads` storage bucket
Private bucket + RLS so authenticated users can upload to and read their own folder (path prefix = `auth.uid()/...`).

```sql
insert into storage.buckets (id, name, public) values ('weekly-uploads', 'weekly-uploads', false);

create policy "Authenticated users can upload to own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'weekly-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users can read own uploads"
on storage.objects for select to authenticated
using (bucket_id = 'weekly-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Modify `src/components/AppShell.tsx` `TopBar`
- Add a hidden `<input type="file" accept=".pptx,.pdf,.xlsx,.xls" />` and a `ref` to trigger it.
- Add local state `status: "idle" | "uploading" | "success" | "error"` and `message: string | null`.
- Replace the Upload button's `onClick` with a handler that opens the file picker. Styling unchanged.
- On file selected:
  1. Set status `uploading`, message `"Extracting data from report, please wait..."`.
  2. Get current session via `supabase.auth.getSession()`. If no session → show error.
  3. Build storage path `${session.user.id}/${Date.now()}-${file.name}`.
  4. `await supabase.storage.from("weekly-uploads").upload(path, file, { upsert: false })`.
  5. POST to `${VITE_SUPABASE_URL}/functions/v1/process-upload` with
     `Authorization: Bearer ${session.access_token}`, `apikey: <publishable>` (from `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`), `Content-Type: application/json`, body `{ file_path: path, file_name: file.name }`.
  6. On HTTP 2xx: status `success`, message `"Report uploaded successfully. Dashboard is now live."`, then reload the page (`window.location.reload()`) after ~1s so all `useReport` hooks re-fetch the new `reportId` + table data.
  7. On any failure (storage upload, missing session, non-2xx, network error): status `error`, message `"Upload failed, please try again."`, console.error the underlying error for debugging.
- Reset the input value after handler completes so the same file can be reselected.

### 3. UI feedback
- Render a small inline status banner directly under the TopBar (does not change existing button or layout):
  - `uploading`: surface-container background, spinner icon `progress_activity` (animate-spin), message text.
  - `success`: secondary-container background, `check_circle` icon.
  - `error`: error-container background, `error` icon plus a small Dismiss `×` button that sets status back to `idle`.
- Button is disabled while `status === "uploading"` (visually unchanged otherwise — keep all classes).

### 4. Edge Function assumption
The `process-upload` function is assumed to already exist remotely on the Lovable Cloud backend (per project knowledge). No new function file is created. If the call returns non-2xx, the UI shows the generic error message.

### Untouched
- Sidebar, Download Summary PDF button, header layout, all page routes, all hooks, all other components.

### Files changed
- New SQL migration (storage bucket + policies)
- `src/components/AppShell.tsx`