## Changes

### 1. Mpox — "Cumulative Cases" card height (`src/routes/_authenticated/mpox.tsx`)
The 5 other cards in that row use `centered` (taller, vertically-centered layout). "Cumulative Cases" omits it, so it falls back to the shorter `h-32` variant. Add `centered` to the Cumulative Cases `MetricCard` so all 6 cards match in size and styling.

### 2. IDSR — 4 stat cards centered (`src/routes/_authenticated/idsr.tsx`)
The 4 IDSR cards (Reporting Timeliness, Reporting Completeness, Total Alerts Triggered, Alerts Investigated) currently use the short non-centered variant — icons sit cramped in the top-right and content isn't centered (image-10). Add `centered` to all 4 so they:
- icon top, large number centered, label below, subtext below
- equal height, evenly spaced in the existing `lg:grid-cols-4` grid

No grid changes needed (already 4-up). No component or theme changes.

## Out of scope
No other pages, no token/theme/sidebar changes.
