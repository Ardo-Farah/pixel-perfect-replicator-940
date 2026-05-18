## Goal
Fix legend placement on the two top charts in `src/routes/_authenticated/mpox.tsx` so the legends sit neatly below the X-axis title, centered under the plot area, and don't overlap "Epi week / Year".

## Changes (file: `src/routes/_authenticated/mpox.tsx`)

### 1. Epi curve (Cases / Deaths legend)
- The current HTML legend uses `justify-center` across the full card width, but the chart's Y-axis offset (left margin) makes it look shifted to the left of the visual chart center.
- Fix: add left padding to the legend wrapper matching the chart's left axis area so the legend appears centered under the plotted bars, and add a small top margin so it sits clearly below "Epi week / Year".
- Change the wrapper from `mt-4 flex items-center justify-center gap-6` to `mt-2 flex items-center justify-center gap-6 pl-[40px]` (matches `margin.left: 20` + Y-axis width ≈ 40px).

### 2. Distribution of Mpox cases by county (county legend)
- Current `<Legend verticalAlign="bottom" height={32} />` renders above/overlapping the "Epi week / Year" axis title because Recharts places the legend immediately below the axis ticks, colliding with the axis label.
- Fix: remove the Recharts `<Legend />` from inside the chart and render a custom HTML legend below the chart container (same pattern already used by the epi curve). This guarantees clear separation below the X-axis label.
- Increase chart container height slightly (or reduce bottom margin to 60) since we no longer need 80px reserved for an in-chart legend.
- Build a wrapping flex row with all county color chips + name + "Other", using `flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-3 text-on-surface-variant` and `fontSize: 13`, max font-size ≤14.

## Out of scope
- No color, data, axis, title, summary text, or other section changes.
- Donut, HIV, death-analysis charts untouched.
