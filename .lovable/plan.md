## Expand IDSR Overview dashboard

Edit only `src/routes/_authenticated/idsr.tsx`. Keep all existing content (KPI cards, Regional IDSR Performance table, Geographic Reporting Distribution, IDSR Response Updates). Reuse existing components (`Card`, `SectionCard`, `MetricCard`) and existing color tokens — no theme changes.

### 1. Data source banner (top, just under cards)
A full-width pill/strip with `bg-secondary-fixed text-on-secondary-container` (matches existing accent style) reading:
**"Data source: Weekly IDSR reports, KHIS"** with a small `database` material icon.

### 2. New section — "Overview of key indicators of IDSR, Kenya from Epi week 1–18, 2026"
- `SectionCard` with title above
- Two bullet callouts (subtitle area): "Completeness averaged 86% and timeliness 84% for Epi weeks 1–18, above the 80% threshold" / "Epi week 9 recorded the lowest timeliness at 76%"
- Grouped bar chart (Recharts) per county: two bars (Week 18 Reporting rate, Week 18 Reporting on time) + reference line at 80%. Counties from screenshot (~47 Kenyan counties) with representative percentages.

### 3. New section — "IDSR Completeness and timeliness per county, Kenya, Epi week 18, 2026"
- `SectionCard`
- Bullets: counties below 80% threshold list; counties below threshold for two consecutive weeks
- Line chart (Recharts): Week 17 vs Week 18 per county + reference line at 80%

### 4. New section — "Reporting rate per County in the past 4 weeks — Epi week 17 and 18, 2026, Kenya"
- `SectionCard`
- Bullet: "Even with overall completeness over 80%, Kajiado, Marsabit and Narok consistently reported low in the last two weeks"
- Simple table: County | Week 15 | Week 16 | Week 17 | Week 18 (cells below 80% styled with `text-error`)

### 5. New section — "Event based surveillance, Kenya — CEBS 13th to 19th April"
- `SectionCard` with table: County, CEBS Signals Reported, CEBS Signals Verified, % Verified, CEBS Signals Verified True, % Verified True, Events Investigated, % Investigated, Events Responded, % Responded, Events Escalated, % Escalated
- Rows: Nakuru, Meru, Busia, Siaya, Mombasa, Baringo, Nairobi, Kajiado + Total
- Low-percentage cells highlighted with `bg-error-container text-on-error-container`
- 3 bullets below the table (signals reported leader, verification leader, investigation status)

### 6. New section — "Hospital Event-based surveillance — Kenya HEBS 13th to 19th April"
- `SectionCard` with similar table structure for HEBS data
- Rows: Mombasa, Nairobi, Meru, Nakuru, Siaya, Baringo, Kajiado + Total
- 3 bullets below (Mombasa leader, verification note, Nairobi investigation note)

### Layout
Stack new sections vertically below the existing two-column grid (Map + Updates). Order matches the request:
1. Data source banner (top, after KPI cards)
2. Existing Regional IDSR Performance table
3. Existing Map + Updates
4. Overview of key indicators
5. Completeness and timeliness per county
6. Reporting rate past 4 weeks
7. Event based surveillance
8. Hospital Event-based surveillance

### Technical notes
- Use `recharts` (already available via `src/components/ui/chart.tsx`) for the two charts.
- All colors via existing semantic tokens (`primary`, `secondary`, `error`, `tertiary`, `surface-container-*`). No new CSS variables.
- Data is static fixture data inline in the route file (consistent with how `regional` and `updates` are already defined).
- No new files, no schema/migration changes, no business logic.
