## Scope

UI/presentation-only changes across the dashboard. No schema or business logic changes.

## 1. Zero instead of dashes for numeric metrics

Anywhere a metric card / stat / table cell expects a number and currently shows `"--"`, render `0` when the value is null/undefined/missing. Loading state stays as a skeleton (or "…"), not `0`, so we don't show false zeros while data is fetching.

Files touched (all routes under `src/routes/_authenticated/`):
- `index.tsx` — `val()` / `fmt()` helpers, grade row, stats strip, disease cards.
- `mpox.tsx`, `measles.tsx`, `anthrax.tsx`, `floods.tsx`, `nutrition.tsx`, `idsr.tsx`, `support.tsx` — every `MetricCard` / table cell currently hardcoded to `"--"`.

Helper change: update each file's `fmt(n)` so `null/undefined → 0`. For the few cases where `"--"` is used for a non-numeric field (e.g. county name fallback in `anthrax.tsx` line 125/136), keep the dash since "0" doesn't make sense for a label.

## 2. Light-blue bullet squares → WHO blue #009ADE

The small `bg-secondary-fixed` squares used as bullet markers in description lists (Mpox/Measles/IDSR notes, etc.) are currently the pale `#c9e6ff`. Replace the bullet color with WHO blue `#009ADE` for contrast.

Approach: add a `--who-blue: #009ADE` token in `src/styles.css`, then replace `bg-secondary-fixed` → `bg-[var(--who-blue)]` (or a new `bg-who-blue` utility) **only** on bullet-marker spans (`h-2 w-2` squares). Leave `bg-secondary-fixed` alone on chips, icon backgrounds, and rounded pills — those aren't bullets.

Files: `measles.tsx`, `idsr.tsx`, and any other route using the `<span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" />` pattern.

## 3. Grade cards: full color fill + white text

In `src/routes/_authenticated/index.tsx`, refactor `GradeCard` so the whole card is filled with the grade color and all text is white:

- Grade 3 → `bg-red-600`
- Grade 2 → `bg-orange-500`
- Grade 1 → `bg-yellow-500` (slightly darker than `yellow-400` so white text passes contrast)
- Ungraded → `bg-gray-500`
- Protracted → WHO blue `#009ADE`

Drop the left border accent and the colored label-only treatment. Value number, grade label, sub-text, and note all render in white. Keep card padding and typography; just swap surface + text colors.

## 4. Add "Protracted" status + per-disease grade tags

Two parts:

**a) Overview grading row:** add a 5th card `PROTRACTED` next to Grade 3 / 2 / 1 / Ungraded. The number shown is the count of diseases currently classified as Protracted (derived client-side from the disease→grade map below; no DB change). Card uses WHO blue fill.

**b) Per-disease grade badge:** add a small pill at the top of each `DiseaseCard` on the overview and at the top of each disease page (Mpox, Measles, Anthrax, Floods, Nutrition, IDSR). The pill uses the matching grade color as background with white text, e.g. "PROTRACTED · GRADE 3".

Mapping (confirmed):
- Mpox → Protracted Grade 3
- Cholera → Protracted Grade 3 (if present)
- Measles → Ungraded
- Anthrax → Grade 2
- Floods → Grade 2
- Nutrition → Grade 2

Implementation: a single `src/lib/disease-grades.ts` exporting `DISEASE_GRADES` + a `GradeBadge` component reused by overview cards and disease page headers. Colors come from the same token set as the grade cards so the look stays consistent.

## Technical notes

- All color changes go through Tailwind utilities or CSS tokens in `src/styles.css`. No inline hex sprinkled across components beyond the existing WHO-blue accents.
- No changes to data fetching, server functions, edge functions, or types. Tables that read `report_summary.grade_1/2/3` still work as-is; "Protracted" is a derived view, not a new column.
- Loading skeletons preserved — zeros only appear once a query resolves with a missing/null value.

## Out of scope

- No changes to charts, maps, or the chat assistant.
- No changes to upload / auth / admin flows.
- "Protracted" is not added as a new DB column. If you later want it stored per-report, that's a follow-up migration.
