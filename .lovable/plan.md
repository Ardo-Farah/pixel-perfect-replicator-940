## Admin Dashboard + remove user-side upload

### 1. Roles in the database (secure pattern)

Create a `user_roles` table (separate from `profiles` to avoid privilege-escalation):
- `app_role` enum: `'admin' | 'user'`
- `user_roles(id, user_id → auth.users, role, created_at)` with unique `(user_id, role)`
- `has_role(_user_id, _role)` security-definer function
- RLS: users read their own roles; admins manage all (via `has_role`)
- GRANT `select` to authenticated; `all` to service_role
- Seed: grant `'admin'` to the user with email `ardoumar6@gmail.com` (they must have signed up first — if not, I'll add a one-time migration that runs after their signup)

A tiny client hook `useIsAdmin()` wraps `supabase.from('user_roles').select(...)` so the UI can branch.

### 2. Route guard

New pathless layout `src/routes/_admin.tsx`:
- `beforeLoad`: check session via `supabase.auth.getUser()`, then check `has_role(uid, 'admin')`; redirect non-admins to `/`
- Renders its own `<AdminShell />` (separate sidebar, distinct color accent, "Admin" badge in header) with `<Outlet />`

### 3. Admin pages (under `src/routes/_admin/`)

```
/admin                  → Overview (KPIs: total users, total reports, total documents, recent activity)
/admin/reports          → Reports management
/admin/users            → Users management
/admin/documents        → Documents library (storage bucket)
/admin/logs             → System logs & analytics
```

**Overview** — KPI cards (users, reports uploaded, storage files, weeks published) + recent activity feed (last 10 audit rows).

**Reports** — Table of `weekly_reports` (week, date, published, uploaded_by, created_at). Actions: upload new (PPTX/PDF/XLSX — reuses existing UploadProvider flow), publish/unpublish toggle, delete (cascades report rows). Reuses the existing `process-upload` edge function.

**Users** — Table joining `auth.users` + `profiles` + `user_roles`. Columns: email, full_name, role, last_sign_in, created_at. Actions: grant/revoke admin, delete user. Uses an `admin-users` server function (TanStack `createServerFn` + `supabaseAdmin`) so we can read `auth.users` safely.

**Documents** — Lists every object in the `weekly-uploads` storage bucket (path, size, uploader folder, created_at). Actions: download (signed URL), delete object.

**Logs & analytics** — Reads `audit_log` table (paginated, filterable by action / user / date). Small bar chart of uploads per week (recharts). If `audit_log` is empty I'll show an empty state — admin actions from this page write to it going forward.

### 4. Audit log writes

Every destructive admin action (delete report, delete user, delete document, role change, publish toggle) inserts into `audit_log` via a server function so it can't be spoofed from the client.

### 5. Remove upload from the user side

In `src/components/AppShell.tsx`:
- Delete the file input, "Upload PPTX / PDF" button, and `useUpload()` wiring from `TopBar`
- Keep the "Download Summary PDF" button
- Remove `<UploadBanner />` and `<UploadProvider>` from the user routes (move both inside `_admin` shell only, so admins still see upload progress)

Files unchanged: all `src/routes/_authenticated/*` page bodies, data hooks, charts. Only the shell loses the upload UI.

### 6. Navigation

Add an "Admin" link to the user sidebar that only renders when `useIsAdmin()` returns true, pointing to `/admin`. Inside `/admin` there is a "← Back to user dashboard" link.

### Technical notes
- New files: `src/routes/_admin.tsx`, `src/routes/_admin/index.tsx`, `_admin/reports.tsx`, `_admin/users.tsx`, `_admin/documents.tsx`, `_admin/logs.tsx`, `src/components/AdminShell.tsx`, `src/hooks/useIsAdmin.ts`, `src/lib/admin.functions.ts` (server fns using `supabaseAdmin` for `auth.users` reads + audit writes), one migration for `app_role`, `user_roles`, `has_role`, audit RLS tweaks, and the admin grant.
- Modified: `src/components/AppShell.tsx` (remove upload UI, add Admin link), `src/router.tsx` if needed for context.
- No new dependencies.
- Admin login: the existing `/login` page works — once `ardoumar6@gmail.com` signs up (or has already), the migration grants the admin role and the Admin link + `/admin` becomes accessible. **You'll use the password you set when signing up that email** — Supabase doesn't expose stored passwords, so I can't print one back. If you want, after the migration I can also reset that account's password to a value you choose via a server function.
