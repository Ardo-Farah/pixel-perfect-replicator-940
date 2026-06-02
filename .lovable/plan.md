# Make the Kenya Concurrent Issues Map more vivid

Scope: `src/components/KenyaChoropleth.tsx` + the `ConcurrentIssuesMap` block in `src/routes/_authenticated/index.tsx`. No data, hook, or other page changes.

## 1. Richer IPC color ramp (more creative, still IPC-faithful)

Replace the flat 4-tone ramp with the official IPC-inspired palette plus depth:

```
Phase 1 Minimal     #cdfacd  (soft mint)
Phase 2 Stressed    #fae61e  (saturated yellow)
Phase 3 Crisis      #e67800  (deep orange)
Phase 4 Emergency   #c80000  (true IPC red)
Phase 5 Famine      #640000  (dark maroon)
Not analysed        #f3f4f6  (light gray, not pure white)
```

- Update `IPC_BUCKETS` and `IPC_LEGEND` in `index.tsx` to match (add Phase 1 + Famine entries).
- In `KenyaChoropleth.tsx`, soften county borders to `#94a3b8` at 0.6 stroke and add a subtle drop-shadow filter on the whole map group for depth.

## 2. County name labels on the map

In `KenyaChoropleth.tsx`, after rendering markers, render a `<text>` at each centroid **only for counties that have a marker in the current view** (so the map stays legible — we don't label all 47). Style:
- font-size 8, font-weight 600, fill `#0f172a`, `paint-order: stroke`, `stroke: #ffffff`, `stroke-width: 2` for a halo effect against any base color
- offset y by `+ (markerRadius + 9)` so the label sits just below its symbol
- text-anchor middle, title-cased county name

Pass an optional `showLabels?: boolean` prop (default true when markers exist) so behavior stays opt-in.

## 3. Bolder, more distinctive symbols

In `KenyaChoropleth.tsx` marker renderer:
- Bump base radius: sm=5, md=8, lg=11.
- Add a soft white halo: render each shape twice — first a white version with `r+2` at opacity 0.85, then the colored shape on top. Gives strong contrast over any IPC fill.
- Replace the muted disease colors with a more vibrant set (updated in `index.tsx`):
  - Mpox: `#7c3aed` (violet) circle
  - Measles: `#059669` (emerald) triangle
  - Anthrax: `#b91c1c` (crimson) square with rotated 45° diamond variant
  - Floods: `#0ea5e9` (sky) droplet
  - Add an IPC/Nutrition star marker `#f59e0b` for counties in Phase 3+ on the "All" view (top 5 by phase) so that view actually shows something distinctive.
- Mpox size threshold lowered: lg if `cases_2026 > 50`, md if `> 10`, else sm — gives more visual variation.

## 4. "All Concurrent Issues" view — show every signal

Currently the All view overlays mpox+measles+anthrax+floods. Add the top IPC-stressed counties as star markers so users see food-insecurity hotspots alongside disease markers. Update the legend accordingly.

## 5. Fix Floods "No data" overlay

`hasData` currently only checks IPC values; on the Floods view with markers present it can still flash the empty state when IPC data is sparse. Update `hasData` to also consider `markers.length > 0` (already does, but ensure the empty message only shows when **both** ipc data and markers are empty).

## 6. Polish

- Increase map height from 400 → 460 to give labels breathing room.
- Add a faint radial vignette behind the map via a CSS gradient on the wrapper for a more "premium" feel.
- Legend swatches: switch from plain squares to small rounded shapes matching the symbol (circle/triangle/square/droplet/star) so the legend mirrors the map.

## Files touched
- `src/components/KenyaChoropleth.tsx` — palette, label rendering, halo, shape sizes, hasData fix.
- `src/routes/_authenticated/index.tsx` — IPC_BUCKETS, IPC_LEGEND, marker builders (colors + sizes), All view extra IPC stars, legend shape hints.

No DB, hook, or other page changes.
