## Goal

Expand the Mpox page with new analytical sections, matching the IDSR Overview style (data-source banner, `SectionCard` blocks with title + small summary, square bullet response notes), without touching colors, theme, or existing Response Notes and Regional Distribution Map (only the map title changes).

## What stays the same

- AppShell, week dropdown, top metric cards (Cumulative Cases, CFR, New Cases, Counties Affected, Recovered, Samples Sequenced).
- County Breakdown table.
- Regional Distribution Map card — only title changes to: "Map of Kenya showing Counties which have reported confirmed Mpox cases".
- Response Notes & Updates card (kept as-is).
- All existing colors, fonts, spacing, and component variants (`MetricCard`, `SectionCard`, `Card`, `NotesCard`, `StatusPill`).

## New sections to add (in order, IDSR-style)

1. **Data source banner** (right under the top metrics, identical pattern to IDSR):
   - Text: "Data source: Ministry of Health Kenya"
   - Uses the same `bg-secondary-fixed` chip with database icon.

2. **Epi curve of confirmed Mpox cases, Kenya 2024–2026** — `SectionCard`
   - Recharts stacked `BarChart`: cases (primary navy) + deaths (error red) per Epi week.
   - Small summary below chart: "Four counties have consistently reported cases with Mombasa leading 40%, Nairobi 17%, Busia 10% and Makueni 7.4%."

3. **Distribution of Mpox cases by county, Kenya 2024–2026 (n=1,123)** — `SectionCard`
   - Recharts `BarChart` sorted descending by cases; cases + deaths series.
   - Summary bullets (square markers, IDSR-style):
     - 38/47 (81%) have been affected
     - Four counties have consistently reported cases with Mombasa leading 40%, Nairobi 17%, Busia 10% and Makueni 7.4%

4. **Demographic characteristics of Mpox cases, Kenya 2024–2026** — `SectionCard`
   - Two **donut charts** side-by-side (Recharts `PieChart` with `innerRadius`):
     - Age distribution (N=657): 0-4, 5-14, 15-24, 25-34, 35-44, 45-54, 55+
     - Occupation: Missing, Blanks, Unknown, Other, Business Person, Unemployed, Employee, Driver, Sex Worker, Student, Health Care Worker, Farmer
   - Summary bullets (square markers):
     - Truck drivers, sex workers and business workers constitute 26% (129 cases)
     - Those aged 15–44 yrs accounted for 69% (456 cases)
     - Reported males 32%, females 30%, 400 cases (38%) missing data
     - Transmission dynamics: predominantly sexual transmission

5. **Mpox deaths HIV status** — `SectionCard`
   - Recharts grouped `BarChart`: Female (Positive, Unknown), Male (Negative, Positive, Unknown). N=19.
   - Summary bullets (square markers):
     - Among deaths with confirmed HIV status, majority were female (62%)
     - Most deaths occurred among HIV positive individuals (68%)
     - The HIV-negative case had a co-morbidity — Diabetes Mellitus

6. **Mpox death analysis** — `SectionCard`
   - Recharts `BarChart` of deaths by age group split Female/Male. N=19.
   - Summary bullets (square markers):
     - Total deaths: 19
     - Females accounted for majority of deaths, 10 cases (53%)
     - Among females, highest deaths in 25–34 age group
     - Among males, deaths highest in 35–44 age group
     - Most deaths among adults aged 25–54 years

## "Square bullet" pattern (matches IDSR list items)

Reuse the IDSR list pattern: a small filled square marker (`h-2 w-2 rounded-sm bg-primary`) aligned to the first line of text, with the bullet text in `text-body-md text-on-surface`. Keep spacing `space-y-3` inside each summary block.

## Data approach

All chart/summary data is hard-coded constants at the top of `mpox.tsx` (matching the screenshots). No DB schema changes — the existing `mpox_data` / `mpox_counties` / `mpox_demographics` tables are not populated with this aggregated 2024–2026 data, so the new sections render the reference figures from the slides exactly as shown. This matches how IDSR already mixes table-driven data with constant chart datasets.

## Files to change

- `src/routes/_authenticated/mpox.tsx` — add 5 new `SectionCard` sections, data-source banner, square-bullet helper component; change the map title string; keep everything else untouched.

No changes to: `AppShell`, `dashboard.tsx`, `styles.css`, hooks, providers, or any other page.

## Verification

- Visual: confirm new sections render below metrics, above the map+notes grid, with consistent spacing, no color drift.
- Build: zero TS errors, Recharts components import cleanly.
