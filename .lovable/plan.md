
## Summary Dashboard Redesign

Update `src/routes/_authenticated/index.tsx` to match the attached screenshots. Keep existing fonts, icon style, colors (primary blue, semantic tokens), and "View detail" link style consistent with the rest of the app.

### 1. Intro section (top)
- Add a short intro paragraph below the existing AppShell title (do NOT add the big "Kenya Health Emergencies Summary" H1 from the screenshot — title already exists in AppShell).
- Copy: "Kenya is managing multiple concurrent public health emergencies. This dashboard provides a centralized overview of key surveillance data, response grades, and geospatial trends across the country to support informed decision-making."

### 2. Grading row (4 cards with colored left border)
Replace the current "Week / Kenya National View" pill row with 4 grade cards:
- GRADE 3 — red left border — "Active cases" / "Critical emergency response" — value from `report_summary.grade_3`
- GRADE 2 — orange left border — "Active cases" / "Moderate severity events" — `grade_2`
- GRADE 1 — yellow left border — "Active cases" / "Localized health impact" — `grade_1`
- UNGRADED — gray left border — "Ongoing events" / "Routine monitoring" — derived (use `outbreaks` or static placeholder if no field; will use `outbreaks` as best available)

### 3. Stats strip (4 inline metrics in one card)
Single card with 4 columns separated by vertical dividers:
- NEW EVENTS — `report_summary.new_events`
- ONGOING EVENTS — `report_summary.outbreaks` (closest existing field)
- OUTBREAKS — `report_summary.outbreaks`
- HUMANITARIAN CRISIS — static `0` (no DB field; render `—` when loading)

### 4. Priority Disease Summary (reorder: Mpox → Measles → Anthrax)
- Section header with icon + "Priority Disease Summary".
- Replace current 3 cards (Mpox / Measles / Floods) with Mpox / Measles / Anthrax in that order.
- Rows per card: New Cases (this week), Cumulative Cases, Deaths, Counties Affected.
- Anthrax pulls from `anthrax_data` (array) — aggregate: sum `human_cases` for cumulative, sum `human_deaths` for deaths, distinct `county` count for counties affected, new cases this week left as `—` (no field).
- Keep existing "VIEW FULL DETAIL →" link style (label uppercased to match screenshot).
- Keep existing card icons but use the screenshot's icons: Mpox `coronavirus`, Measles `vaccines` (asterisk-like), Anthrax `bug_report`.

### 5. Kenya Concurrent Issues Map
New section card below disease summary:
- Header: "Kenya Concurrent Issues Map" / subtitle "Projected IPC Acute Food Insecurity & Disease Prevalence (April–June 2026)" / right-side link "IPC GEOSPATIAL DATA v1.06".
- Left: `<MapPlaceholder />` (existing component).
- Right column legends (static):
  - IPC CLASSIFICATION: Emergency (red), Crisis (orange), Stressed (yellow), Not Analysed (gray).
  - DISEASE SURVEILLANCE: Mpox (>50 cases), Mpox (<50 cases), Measles Outbreak, Suspected Anthrax.
  - PROJECTION PERIOD badge: "APRIL — JUNE 2026".

### 6. WHO Kenya footer block
New card at bottom with 3 columns:
- WHO KENYA: "Working for a healthier world. WHO's primary role is to direct and coordinate international health within the United Nations system."
- CONTACT INFORMATION: `communications_keny[a]@who.int`, `+254 700 000 000`, "UN Gigiri Complex, Nairobi, Kenya".
- FOLLOW OUR UPDATES: LinkedIn, Twitter, Instagram icon row (material-symbols placeholders).
- Bottom strip: "MADE BY WHO KENYA COUNTRY OFFICE © 2026" left, "Privacy Policy · Terms of Use · Surveillance Guidelines" right.

### Out of scope
- All other pages.
- Schema/DB changes.
- Adding a real map — keep `MapPlaceholder`.
- No changes to AppShell, header, sidebar.

### Technical notes
- All values use existing `useTableData` hook; add `useCountyData<AnthraxRow>("anthrax_data", reportId)` for anthrax aggregation.
- Reuse existing `Card`, `MapPlaceholder` components, `text-display-metric`, `text-label-caps`, `text-headline-sm` tokens. No new colors except grade border accents using existing `bg-error`, semantic orange/yellow/gray (inline border-l-4 with token colors).
- Loading state shows "…" matching existing pattern; empty state unchanged.
