## Admin Dashboard — Mock Data First

Build out the four admin pages with realistic mock data so the UI/UX is fully reviewable before any backend wiring. The admin shell, route guard, and sidebar already exist — this phase only fills in page content.

### Approach

- Keep the existing `AdminShell` (dark navy sidebar, "Admin" badge) untouched.
- **Temporarily relax the admin guard** in `src/routes/admin.tsx` so you can preview pages without seeding a role yet. Add a `// TODO: re-enable role check before backend wiring` comment.
- Create one shared `src/lib/admin-mock-data.ts` file holding all fixtures (users, reports, documents, logs, KPI series). Pages import from there so swapping to Supabase later means changing imports, not rewriting JSX.
- Use existing design tokens (`bg-surface`, `text-primary`, `text-on-surface-variant`, `#009ADE` accent) and shadcn `Table`, `Card`, `Badge`, `Button`, `AlertDialog`, `Input` components.

### Pages

**1. `/admin` — Overview**
- 4 KPI cards: Total Users, Published Reports, Documents Stored, Actions (7d)
- Mini bar chart (recharts) — uploads per week, last 8 weeks
- Recent activity feed (last 8 audit entries)
- Quick links to the other 3 sections

**2. `/admin/reports` — Reports management**
- Table: Week #, Reporting Date, Status (Published/Draft badge), Uploaded By, Actions
- Row actions: Publish/Unpublish toggle, Delete (with AlertDialog confirmation)
- Top-right "Upload new report" button (opens file picker — mock only, shows toast "Mock upload — backend coming next")
- Search input + status filter

**3. `/admin/users` — User management**
- Table: Name, Email, Role (User/Admin badge), Joined, Last Active, Actions
- Row actions: Grant/Revoke admin, Delete user (AlertDialog)
- Search by email/name

**4. `/admin/documents` — Document library**
- Grid of file cards: filename, size, uploaded date, week tag
- Per-card actions: Download (mock), Delete (AlertDialog)
- Filter by file type (PPTX / PDF / XLSX)

**5. `/admin/logs` — Logs & analytics**
- Recharts bar chart: actions per day (last 14 days)
- Recharts pie: action breakdown (publish / delete / upload / role-change)
- Full audit table: Timestamp, Actor, Action, Target

### Technical notes

- New file: `src/lib/admin-mock-data.ts` (~150 lines of fixtures + TypeScript types matching the future Supabase schema, so the swap is mechanical).
- Edited files: the 5 admin route files (`src/routes/admin/index.tsx`, `reports.tsx`, `users.tsx`, `documents.tsx`, `logs.tsx`) and `src/routes/admin.tsx` (relax guard).
- All destructive actions show toast `"Mock action — backend wiring next phase"` instead of mutating anything.
- No new dependencies (recharts and shadcn already installed).
- No backend, migrations, or server functions touched in this phase.

### Out of scope (next phase)

- Wiring `user_roles` checks, real `weekly_reports` CRUD, storage bucket listing, audit-log writes, and the real upload flow into `process-upload`.
