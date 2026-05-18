## 1. Remove top filter bar (Anthrax & Floods)

Delete the `<Card>` block at the top of these pages that contains the "Week N" pill, "Kenya National View" chip, and "Active Outbreak: — Counties" chip:

- `src/routes/_authenticated/floods.tsx` (lines ~68–80)
- `src/routes/_authenticated/anthrax.tsx` (matching block)

Page title bar (with "Week 5: 26th January…" and Upload/Download buttons) is part of `AppShell` and stays untouched.

## 2. Historical Trends — wire to real data

File: `src/routes/_authenticated/trends.tsx`

**Selectors become functional:**
- Primary Period & Comparison Period — populate from `weekly_reports` (id, week_number, reporting_date, published=true, ordered desc). Use shadcn `Select`.
- Disease Focus — static list: All Diseases, Mpox, Measles, Anthrax, Floods, IDSR, Nutrition.
- View Aggregation (Weekly/Monthly) — local state; Monthly groups N weeks into months by `reporting_date`.
- Comparison toggle — when off, only primary period is analyzed.

**Generate Analysis** fetches the relevant table(s) for the selected report_id(s) and renders, replacing the "Awaiting Parameters" empty state:
- Summary cards: key metric for primary vs comparison + delta (% change, colored).
- Recharts bar/line comparing the two periods across the disease's primary metrics (e.g. Mpox → cumulative_cases, new_cases_this_week, deaths, cfr; Floods → total_deaths, counties_affected, missing_persons; etc.).
- "All Diseases" → grid of mini comparison cards, one per disease.
- Loading skeletons + empty state ("No data for selected period").

Data fetched directly via existing `supabase` client (same pattern as other pages); no new tables, no edge function, no schema change.

## 3. Out of scope
No layout/styling changes to the page chrome. AppShell header (week selector + Upload/Download) untouched on every page.

### Technical notes
- New hook `useWeeklyReports()` in `src/hooks/useReport.ts` returning `{ reports: {id, week_number, reporting_date}[], loading }`.
- Trends page state: `{ primaryId, comparisonId, comparisonEnabled, disease, aggregation }`.
- Disease→table map drives which Supabase query runs on Generate.
