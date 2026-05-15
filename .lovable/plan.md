## Goal

Replicate the supplied "WHO Kenya — Health Surveillance" design as a multi-page TanStack Start app. All visual decisions (colors, fonts, radii, spacing, shadows, layout) come verbatim from the attached `DESIGN.md` and `screen.png` files — nothing is invented.

## Design tokens (from DESIGN.md / code.html)

Drop into `src/styles.css` as the single source of truth, in `oklch`:

- Surfaces: surface `#f8f9fa`, surface-container-lowest `#ffffff`, -low `#f3f4f5`, container `#edeeef`, -high `#e7e8e9`, -highest `#e1e3e4`, surface-dim `#d9dadb`
- Text: on-surface `#191c1d`, on-surface-variant `#43474f`
- Brand: primary `#001e40`, primary-container `#003366`, on-primary `#fff`, inverse-primary `#a7c8ff`, primary-fixed `#d5e3ff`, primary-fixed-dim `#a7c8ff`
- Secondary (azure accent): secondary `#006591`, secondary-container `#5abffe`, on-secondary-container `#004c6f`, secondary-fixed `#c9e6ff`, secondary-fixed-dim `#89ceff`
- Tertiary: `#0e2127` / container `#24363d`
- Status: error `#ba1a1a`, error-container `#ffdad6`, on-error-container `#93000a`; success uses tailwind green-500/600/100/800 as in markup
- Borders: outline `#737780`, outline-variant `#c3c6d1`
- Radii: sm 0.25rem, DEFAULT 0.5rem, md 0.75rem, lg 1rem, xl 1.5rem, full 9999px
- Spacing utilities: container-padding 2rem, card-padding 1.5rem, grid-gutter 1.5rem, element-gap 0.75rem, section-margin 2.5rem
- Shadow on cards: `0 2px 4px rgba(0,0,0,0.05)`
- Type: Inter only, with the six named scales: display-metric 36/44 700 -0.02em, headline-sm 18/24 600, body-md 14/20 400, label-caps 11/16 600 0.05em uppercase, table-header 12/16 600, metric-subtext 13/18 400

Load Inter (400/600/700) and Material Symbols Outlined from Google Fonts in `__root.tsx` head.

## Layout shell

Match `code.html` exactly:

- Fixed left sidebar 260px: WHO Kenya logo + "Health Surveillance" subtitle, nav items with Material Symbols icons, active item uses `bg-secondary-container` + `text-on-secondary-container` + `border-l-4 border-secondary`, inactive items hover `bg-surface-container-low`. Bottom: "Official Profile / Regional Coordinator".
- Main shifted `ml-[260px]`. Sticky top header: page title + "Weekly Surveillance Brief" sub-link, week selector pill, "Download Summary PDF" outlined button, notification bell, avatar.
- Content wrapper `p-8 max-w-[1600px] mx-auto space-y-10`.

## Routes (TanStack file-based, all under shared `_layout` route)

```
src/routes/
  __root.tsx                 (head + fonts + Outlet)
  _layout.tsx                (sidebar + topbar + Outlet)
  _layout.index.tsx          → /  Summary (use IDSR overview screen)
  _layout.mpox.tsx           → /mpox
  _layout.measles.tsx        → /measles
  _layout.anthrax.tsx        → /anthrax
  _layout.floods.tsx         → /floods
  _layout.idsr.tsx           → /idsr
  _layout.nutrition.tsx      → /nutrition
  _layout.trends.tsx         → /trends
  _layout.support.tsx        → /support
```

Each route's `head()` sets a unique title + meta description.

## Per-screen replication

For each of the 10 PNGs I will rebuild the page section-for-section:

- **IDSR Overview / Summary** — 4 KPI cards row, "Regional IDSR Performance" table card with status pills (Target Met = secondary-container, Stable = surface-container-high, Below Target = error-container), Geographic Reporting card with map placeholder + Top Region / Gaps tiles, IDSR Response Updates feed with circular icon badges and LIVE pill.
- **Mpox** — 3×2 metric grid, "Other Key Surveillance Metrics" table with status chips, Regional Distribution Map placeholder, Response Notes & Updates numbered list with "Last Update" footer.
- **Measles** — 3×2 layout with full-width table variant.
- **Anthrax** — refined map layout + 3×2 full-width table variant.
- **Floods & MAM Rains** — refined dashboard + 3×2 full-width map variant.
- **Nutrition & Food Security** — refined hierarchy with metric cards + nutrition tables.
- **Historical Trends** — selection-state layout (filter chips active, line chart placeholder, comparison cards).
- **User Support** — bento metric grid with mini progress bars under each metric (built from `code.html`), Recent Support Tickets table with avatar circles + URGENT/MEDIUM/LOW pills + status dots.

All data values come straight from the screens (no fabricated numbers).

## Components (`src/components/`)

Small set, all using semantic tokens:

- `AppSidebar.tsx`, `AppHeader.tsx`
- `MetricCard.tsx` (variants: simple icon-top, with-progress-bar, with-accent-bar)
- `StatusPill.tsx` (`target-met | stable | below-target | urgent | medium | low | live | stable-green | processing | verified | cleared | active | successful | in-progress | cumulative | monitored`)
- `DataTable.tsx` (header bg `surface-container-low`, divider `outline-variant`, hover `surface-container`)
- `NotesCard.tsx` (soft blue tint background `#f8fbff`, "i" badge header, numbered or bulleted)
- `MapPlaceholder.tsx` (the dashed gradient blob frame seen on IDSR + Mpox screens)
- `ResponseUpdateItem.tsx` (circular tinted icon + title + body + meta)

Icons: Material Symbols Outlined via the Google Fonts stylesheet, exactly as the source HTML uses them (no Lucide swaps — the design uses Material).

## Index placeholder

Replace the `PlaceholderIndex` in `src/routes/index.tsx` (it'll be moved into `_layout.index.tsx` as the Summary/IDSR Overview page).

## Out of scope

- No real interactivity beyond visual hover/active states (no real maps, no live data, no auth, no backend).
- No design changes — every value pulled from `DESIGN.md` and the screens.

## Verification

After build, navigate each route in the preview and visually compare against the corresponding `screen.png` (typography weight, card radii, pill colors, table header tint, sidebar active treatment). Adjust any drift before finishing.