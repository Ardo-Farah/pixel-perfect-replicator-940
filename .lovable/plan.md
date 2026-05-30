
# Plan — Admin CMS (Phase 1)

Goal: Let admins edit the *text and links* shown on user dashboards (Overview, Mpox, Measles, Anthrax, Floods, IDSR, Nutrition) from inside the admin panel, plus add long-form "More information" narratives per section. Native browser spellcheck on all text inputs. Style stays exactly as-is.

Follow-ups (NOT in this phase, planned separately later): disease Active/Archived lifecycle, historical/monthly snapshots, custom admin-created dashboards.

---

## What admins will be able to edit

Per page (overview, mpox, measles, anthrax, floods, idsr, nutrition):
- **Page title & subtitle** (e.g. "Mpox Surveillance" / "Week 22 update")
- **Section headings** (e.g. "Distribution", "Demographics", "Response Notes & Updates")
- **Card descriptions** — short helper text under KPI cards
- **KPI value overrides** — optional manual override of any numeric card (falls back to uploaded report data when blank)
- **Links** — external URLs attached to cards/sections (e.g. "Source", "Read more")
- **"More information" narratives** — long-form rich text per section (Epi summary, Distribution, Demographics, Deaths, Response Notes). Opens in a side panel/dialog from a "More information" button on each eligible section.

All textareas/inputs use the browser's native `spellCheck` so misspellings are underlined while typing.

---

## Admin UX

New admin route: **`/admin/content`** ("Page Content" in the sidebar, icon `edit_note`).

Layout:
- Left rail: list of pages (Overview, Mpox, Measles, Anthrax, Floods, IDSR, Nutrition)
- Right pane for the selected page:
  - **Page header** — title + subtitle inputs
  - **Sections** — accordion list of sections defined for that page. Each section row exposes: heading, short description, optional link (label + URL), KPI overrides (key → number), and a rich "More information" textarea.
  - Sticky **Save** button (per page). Toast on success, inline validation errors on failure.

All edits go through admin-only server functions; nothing is editable from the user side.

---

## User-facing behaviour

- Each user page (`/mpox`, `/measles`, etc.) fetches its content overrides alongside its report data.
- Where an override exists, it replaces the hardcoded label/description/KPI. Where it doesn't, current defaults render unchanged.
- Sections that have a "More information" narrative show a small **"More information →"** button that opens a side dialog rendering the narrative (markdown rendered safely). No narrative = no button.
- Zero visual change when no overrides exist — style is preserved.

---

## Technical design

### Database (single migration)

One table powers all overrides, keyed by page + section + field. This avoids a wide schema and scales as we add sections.

`public.page_content`
- `id uuid pk`
- `page_key text` — e.g. `overview`, `mpox`, `measles`, `anthrax`, `floods`, `idsr`, `nutrition`
- `section_key text` — e.g. `header`, `kpis`, `distribution`, `demographics`, `deaths`, `response_notes`
- `field_key text` — e.g. `title`, `subtitle`, `heading`, `description`, `link_label`, `link_url`, `more_info_md`, or a KPI key like `kpi.total_cases`
- `value_text text` (nullable) — used for text/url/markdown
- `value_number numeric` (nullable) — used for KPI overrides
- `updated_by uuid` (nullable) — admin user
- `updated_at timestamptz default now()`
- Unique index on `(page_key, section_key, field_key)`

RLS:
- `SELECT` allowed to `authenticated` (so user pages can read overrides)
- `INSERT / UPDATE / DELETE` allowed only via `has_role(auth.uid(), 'admin')`
- `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated; GRANT ALL … TO service_role`

Audit: every admin write also inserts into existing `audit_log` (action `edit_content`).

### Server functions (`src/lib/admin-content.functions.ts`)

- `getPageContent({ page_key })` — public to authenticated users; returns all rows for that page, shaped as `{ [section_key]: { [field_key]: value } }`.
- `upsertPageContent({ page_key, entries: [{section_key, field_key, value_text?, value_number?}] })` — admin only, bulk upsert + audit log entry.
- `getAdminContentIndex()` — admin only; returns the registry of pages + sections + fields the UI should render (so the admin form is data-driven).

Validation with Zod: `page_key` and `section_key` constrained to known enums; `value_text` max 5,000 chars for `more_info_md`, 500 for everything else; `link_url` must be a valid URL.

### Frontend integration

- New hook `usePageContent(pageKey)` wraps `useQuery` → `getPageContent`. Returns helpers `text(section, field, fallback)` and `num(section, field, fallback)`.
- Each existing user page is updated minimally: wrap the literal strings/numbers it currently renders with `content.text("header", "title", "Mpox Surveillance")` etc. No layout/JSX restructuring.
- New shared component `<MoreInfoButton sectionKey="distribution" pageKey="mpox" />` + `<MoreInfoDialog />` — only renders the button when a `more_info_md` value exists.
- Markdown rendering: use `react-markdown` + `rehype-sanitize` (no raw HTML) to safely render narratives.
- Native spellcheck: all admin inputs use `spellCheck` (default for `<input>`/`<textarea>`, explicitly set to be safe).

### Files to add
- `src/lib/admin-content.functions.ts`
- `src/lib/content-registry.ts` — declares which pages/sections/fields exist (single source of truth used by both admin UI and server validation)
- `src/hooks/usePageContent.ts`
- `src/components/MoreInfoDialog.tsx`
- `src/routes/admin/content.tsx`

### Files to edit (surgical)
- `src/components/AdminShell.tsx` — add "Page Content" nav item
- `src/routes/_authenticated/index.tsx`, `mpox.tsx`, `measles.tsx`, `anthrax.tsx`, `floods.tsx`, `idsr.tsx`, `nutrition.tsx` — read overrides via `usePageContent` and render `<MoreInfoButton />` next to eligible section headers
- One Supabase migration for `page_content` + RLS + grants

No files removed. No styling changes. No business-logic changes to uploads, reports, or chat.

---

## Out of scope (next phases)

1. **Disease Active/Archived lifecycle** with "Previous outbreaks in Kenya" archive surfaced via Historical Trends.
2. **Monthly historical snapshots** of the Admin Overview.
3. **Admin-created custom dashboards** with configurable cards.
4. **Excel/SVG/map editing** inside Reports.

We'll plan each of these once Phase 1 is shipped and you've used it.
