## Rewrite Summary page (`src/routes/_authenticated/index.tsx`)

The current Summary page is mock "User Support Dashboard" content (tickets, system health). Replace the entire `SummaryPage` body with live overview data. `AppShell` (which already contains the always-visible Upload PPTX / PDF button, sidebar, and header) is untouched.

### Hooks
- `useLatestReportId()` → `reportId`, `weekNumber`, `loading: reportLoading`
- `useTableData<ReportSummary>("report_summary", reportId)`
- `useTableData<MpoxData>("mpox_data", reportId)`
- `useTableData<MeaslesData>("measles_data", reportId)`
- `useTableData<FloodsData>("floods_data", reportId)`

Types (only the fields used):
```
type ReportSummary = { new_events: number | null; outbreaks: number | null; grade_1: number | null; grade_2: number | null; grade_3: number | null; };
type MpoxData     = { cumulative_cases: number | null; new_cases_this_week: number | null; deaths: number | null; cfr: number | null; counties_affected: number | null; };
type MeaslesData  = { total_cases: number | null; confirmed: number | null; suspected: number | null; counties_affected: number | null; };
type FloodsData   = { counties_affected: number | null; total_deaths: number | null; missing_persons: number | null; };
```

### Helper
- `fmt(n)` → `"—"` if null/undefined, else `n.toLocaleString()`.

### Empty state (when `!reportLoading && reportId === null`)
Inside `AppShell title={"Kenya's Weekly Health Emergencies\n"} subtitle="UPDATES">`:
- Single centered `Card` with `inbox` material icon + heading "No weekly report uploaded yet." + body "Upload a PPTX or Excel file to populate this dashboard."
- Upload button stays in AppShell header (already always visible).

### Loaded state layout
Within the existing `AppShell`:

1. **Header row** — `Week {weekNumber ?? "—"}` chip on the left, "Kenya National View" pill on the right (`Card` wrapper consistent with other pages).

2. **Top KPI grid** (4 cards, reusing `MetricCardWithBar` already defined in this file — keep that helper):
   - `New Events` → `report_summary.new_events`
   - `Active Outbreaks` → `report_summary.outbreaks`
   - `Grade 2 Events` → `report_summary.grade_2`
   - `Grade 3 Events` → `report_summary.grade_3`
   (Drop the `pct/barColor/trackColor` decorative bars — pass `subtext` derived from labels like "Grade 1: N" where helpful, no fake deltas. The MetricCardWithBar component already ignores `pct` in render.)

3. **Disease/event cards grid** (3 columns `lg:grid-cols-3`, one `Card` per source). Each card has a title, icon, and 3–4 small KPIs rendered as `label / value` rows:
   - **Mpox** (icon `coronavirus`):
     - Cumulative Cases → `mpox.cumulative_cases`
     - New (this week) → `mpox.new_cases_this_week`
     - Deaths → `mpox.deaths`
     - CFR → `mpox.cfr` formatted as `${cfr}%` or `"—"`
     - Counties Affected → `mpox.counties_affected`
   - **Measles** (icon `sick`):
     - Total Cases → `measles.total_cases`
     - Confirmed → `measles.confirmed`
     - Suspected → `measles.suspected`
     - Counties Affected → `measles.counties_affected`
   - **Floods & MAM Rains** (icon `water_drop`):
     - Counties Affected → `floods.counties_affected`
     - Deaths → `floods.total_deaths`
     - Missing → `floods.missing_persons`

   Each card footer has a `View detail →` link (`<Link to="/mpox">`, etc.) using existing `text-primary` styling. No fake trends or delta text.

### Loading state
While `reportLoading` OR (`reportId !== null && any of the four hooks .loading`):
- Render the full loaded layout but every value renders `"…"` and the chip values show skeleton pulses (`bg-surface-container-high` blocks).

### Removed (mock content)
- `tickets` array and entire Recent Support Tickets `SectionCard`.
- Clinical Service Health `Card`.
- Support Protocol `NotesCard`.
- "USER SUPPORT DASHBOARD / System Health & Inquiries" intro row and "SYSTEMS STABLE" chip.

### Kept
- `AppShell` wrapper, including its sidebar, header, and always-visible Upload PPTX/PDF button.
- `MetricCardWithBar` helper component definition (reused for KPI grid).
- Imports of `Card`, `MetricCard`-related primitives as needed; remove unused (`NotesCard`, `ProgressBar`, `SectionCard`, `StatusPill`) if they end up unused.

### Untouched files
Only `src/routes/_authenticated/index.tsx` is modified.