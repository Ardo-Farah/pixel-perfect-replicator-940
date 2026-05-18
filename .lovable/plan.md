## Goal

Improve axis labels and legend placement on the Mpox chart sections so X/Y axes are clear and well-spaced — without changing any colors, data, or other content.

## Changes (all in `src/routes/_authenticated/mpox.tsx`)

### 1. Epi curve chart
- Keep X-axis title "Epi week / Year" but move the **legend (Cases / Deaths)** ABOVE the X-axis title with breathing room, so the order bottom-up is: chart → legend → small gap → "Epi week / Year" label.
- Implementation: set `Legend verticalAlign="bottom"` with explicit `height` / `wrapperStyle` margin, and put the X-axis `label` with extra `dy` offset so it sits cleanly below the legend.
- Keep Y-axis label "No of cases" rotated on the left with proper offset so it doesn't clip.

### 2. County distribution (stacked by week) chart
- Ensure X-axis has clear "Epi week / Year" label below ticks with spacing.
- Ensure Y-axis has clear "No of cases" label on the left, vertical, with offset so it never overlaps tick numbers.
- Legend stays where it is (already separate from axis label).

### 3. Age demographic donut
- Confirm legend/labels are spaced; no axes to fix (pie chart). No change unless overlap exists — likely leave alone.

### 4. Mpox deaths HIV status (bar chart)
- Add clear axis titles: Y "No of cases" (left, rotated), X "HIV status / Sex" below the angled tick labels with enough `dy` so it doesn't collide with the rotated labels.
- Move the **N=19** caption from its current position to a clearly readable spot — directly under the chart title or as a right-aligned subtitle in the SectionCard header area.

### 5. Mpox death analysis (bar chart)
- Add clear axis titles: Y "No of cases" (left, rotated), X "Age group / Sex" below angled tick labels with proper `dy` spacing.
- Move the **"N=19 · Age group / Sex"** caption to a clearer placement — render it as a small subtitle right under the section title (top of card) instead of at the bottom-left, matching the screenshot reference style.

## Technique

- Use Recharts `XAxis` / `YAxis` `label` prop with `{ value, position, dy/dx, offset, style: { fontSize: 13, fill: 'currentColor' } }`.
- Use `Legend wrapperStyle={{ paddingTop: 8, paddingBottom: 8 }}` and chart container `margin={{ bottom: 40 }}` to reserve space so the axis title and legend don't collide.
- Font size cap remains ≤14 (per prior rule).
- Captions like "N=19" move into the `SectionCard` header via the `action` prop or a small `<p>` directly below the title.

## Out of scope

- No color changes, no data changes, no removal/addition of sections, no changes to the epi curve series order (cases + deaths stays as is, only legend/axis spacing improves).
