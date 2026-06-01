## Goal

Replace the current single choropleth in the "Kenya Concurrent Issues Map" card on the overview page (`src/routes/_authenticated/index.tsx`) with a richer, multi-view map matching the reference screenshot. Everything stays at **county level** (no sub-county/ward — those remain on the per-disease pages).

Nothing else on the overview page changes.

## What the user sees

Inside the same card, a small **view switcher** (arrows ◀ ▶ + dots, or tabs) cycles through these views:

1. **All Concurrent Issues** (default) — IPC phase fills + every disease overlay on one map.
2. **Mpox** — IPC base fill + Mpox circles (large >80, small <50).
3. **Measles** — IPC base fill + green triangles on affected counties.
4. **Anthrax** — IPC base fill + dark-red bar markers on suspected counties.
5. **Floods** — IPC base fill + blue droplet markers on affected regions.
6. **IPC / Nutrition** — IPC phase fills only (clean view).

Each non-default view shows a **"View full details →"** link in the card header that routes to the matching disease page (`/mpox`, `/measles`, `/anthrax`, `/floods`, `/nutrition`). The user explicitly asked for the ward-level / current-status detail to live on those pages, not here.

The legend on the right updates per view (IPC classification always shown; disease-surveillance section only shows the symbols relevant to the current view; on "All" it shows everything like today).

## Implementation

### 1. Extend `src/components/KenyaChoropleth.tsx`

Add an optional `markers` prop so the same SVG can render symbol overlays on top of the choropleth:

```ts
type MarkerShape = "circle" | "triangle" | "square" | "star" | "droplet";
type CountyMarker = {
  county: string;          // resolved with the existing resolveCounty()
  shape: MarkerShape;
  color: string;           // hex
  size?: "sm" | "md" | "lg";
  label?: string;          // tooltip text e.g. "Mpox · 124 cases"
};
```

- Compute each county's centroid from its projected rings (average of points) once, memoized alongside `paths`.
- For each marker, look up the centroid by `canon(county)` and draw the shape as an SVG element at that point. Tooltip on hover reuses the existing hover state (extended to optionally show marker label).
- Keep the existing `data` / `buckets` / `ramp` props untouched so other callers (county case maps elsewhere) are unaffected.

### 2. Rework the map card in `src/routes/_authenticated/index.tsx`

- Pull the county data already wired (`nutritionCounties`) plus add `useCountyData` for `mpox_counties`, `measles_counties`, `anthrax_data`, and `floods_data` (single-row, region-level — for floods we'll fall back to a fixed county-anchor list per affected region, no schema change).
- Define a small local `VIEWS` array describing each view: `{ key, title, subtitle, buckets, markers(data), legend, detailsHref? }`.
- Wrap the map in a local state `const [viewIndex, setViewIndex] = useState(0)` with prev/next buttons + dot indicator. Header gets a `View full details →` `<Link to={view.detailsHref}>` when present.
- IPC base fill uses graduated `buckets` (Emergency red / Crisis orange / Stressed yellow / Not Analysed light gray) keyed off `ipc_phase` for all views except a future-proof "no base" override (not used now).
- Markers per view:
  - **All**: union of Mpox + Measles + Anthrax + Floods markers.
  - **Mpox**: blue circles, size `lg` if `cases_2026 > 80`, `sm` otherwise; uses `is_hotspot` for ring emphasis.
  - **Measles**: green triangles where `case_count > 0`.
  - **Anthrax**: dark-red squares where `human_cases > 0`.
  - **Floods**: blue droplets on a representative county per non-zero `[region]_deaths` column (mapping defined inline, e.g. Coast → Mombasa, Rift Valley → Nakuru, etc.).
- Legend component already exists locally; render only the entries relevant to the current view.

### 3. No other changes

- Disease pages (`/mpox`, `/measles`, etc.) keep their existing ward / sub-county detail untouched — they're the "for more, click here" destinations.
- No DB / schema / hook changes.
- No styling changes outside this one card and the `KenyaChoropleth` component.

## Files touched

- `src/components/KenyaChoropleth.tsx` — additive `markers` prop + centroid + symbol rendering.
- `src/routes/_authenticated/index.tsx` — map card replaced with multi-view version; rest of file untouched.

## Open question (will assume default unless you say otherwise)

For the view switcher, I'll use **left/right arrows + dot indicators below the map** (matches "as they do the arrow" in your message). If you'd prefer named tabs across the top (All · Mpox · Measles · Anthrax · Floods · IPC), say so and I'll swap that in.
