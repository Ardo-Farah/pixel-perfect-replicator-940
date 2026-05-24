## Scope
Edit only `src/routes/_authenticated/measles.tsx`. Map, layout, and existing 6-card grid stay; only the "Recovered" card label/icon swap and new sections are added. No DB/backend changes (everything uses hardcoded reference data, same pattern as Mpox).

## Changes

### 1. Metric cards (top grid)
Replace the "Recovered" card with **Confirmed Cases** (icon `verified`, value `62`). All other 5 cards untouched.

### 2. Replace "Secondary Measles Metrics" section
Swap the entire `SectionCard` with **Table 1: Distribution of measles cases by county 2026 — Kenya**. Columns: County, Sub County, Total cases, Lab Confirmed, Suspected cases, Total deaths, Date of onset of Index case, Date of onset of last case, Outbreak status. Rows from screenshot (Baringo/Taty East, Marsabit/Moyale, Garissa/Fafi, Garissa/Dadaab, Wajir/Wajir North) + bold red Total row (409 / 62 / 347 / 0). "Active" status uses error pill; "No new cases reported" uses stable pill.

### 3. New "Epi curve of confirmed measles cases, Kenya, 2024–2026" section
Stacked bar chart (Recharts) styled like Mpox epi curve:
- X-axis: weekly dates 20-Nov-25 → 03-May-26 (label "Date of onset / Year")
- Y-axis: "No of cases" 0–30
- Stacked bars: Suspected cases (var(--primary) navy) + Confirmed (gold `#E8B84A`)
- Legend below chart with both colored swatches.
- Justification bullet below chart explaining the curve (Mpox-style `<Bullet>` square markers).

### 4. New "Epidemiological analysis of the reported cases" section
Two donut charts side-by-side (Recharts `PieChart`), matching Mpox demographic donut styling (DONUT_COLORS, innerRadius 70, outerRadius 130):
- **Age distribution (N=360)**: <1 yr (32), 1–4 (60), 5–9 (52), 10–14 (101), 15+ (115).
- **Sex distribution**: Male 223 (62%), Female 137 (38%).
Bullets under: "Most of the cases, 218 (60.5%) are aged ≥10 years"; "More than half are males, 223 (62%)".

### 5. Rename "Clinical Response Notes" → "Response activities and gaps"
Replace the freeform NoteBlocks list with two bullet-square lists matching IDSR's square-marker style (`<Bullet>` component reused from Mpox pattern — `h-2 w-2 bg-secondary-fixed`):
- **Outbreak response immunisation completed**: Tiaty West / Baringo — 9,809 children <10 yrs vaccinated; Tiaty East / Baringo — 5,789 children <5 yrs vaccinated; Marsabit / Moyale — 1,758 children <15 yrs vaccinated; Active case search ongoing at health facility and community levels.
- **Gaps**: Delayed sub-national reporting affecting timeliness.

### 6. Untouched
- Map card (Geographic Measles Distribution) — kept as-is.
- AppShell title/subtitle, page-empty state, data-loading wiring.

## Technical notes
- Add `Bullet` helper component (square `bg-secondary-fixed` marker, same as Mpox).
- Import Recharts primitives (`BarChart`, `PieChart`, `Cell`, etc.) at top.
- Hardcoded reference datasets defined at module scope (mirrors Mpox approach since these are static reference figures from the WHO slide).
- Reuse existing `DONUT_COLORS` palette pattern from Mpox for sex/age donuts.
