## Goal

Add the WHO-blue data source banner (same style as Mpox/Measles/Anthrax) to **Floods & MAM Rains**, **IDSR Overview**, and **Nutrition & Food Security** pages.

## Banner spec

Same as existing implementation: `#00205c` background, white text, no icon, full-width rounded card placed directly below the top metric cards row.

- **With link** (Floods):
  ```tsx
  <div className="flex items-center justify-between rounded-lg px-5 py-3 text-white" style={{ backgroundColor: "#00205c" }}>
    <p className="text-body-md">Data source: National Disaster Operations Centre</p>
    <a href="https://www.ndoc.go.ke/" target="_blank" rel="noopener noreferrer" className="text-body-md underline hover:opacity-80">Click here for link</a>
  </div>
  ```
- **Without link** (IDSR, Nutrition): same container, single left-aligned `<p>`, no right-side link.

## Changes per file

### `src/routes/_authenticated/floods.tsx`
Insert banner directly below the top metric cards grid (before the map/county breakdown row).
Text: `Data source: National Disaster Operations Centre`
Link: `https://www.ndoc.go.ke/`

### `src/routes/_authenticated/idsr.tsx`
Insert banner directly below the top metric cards row.
Text: `Data source: Weekly IDSR reports, KHIS`
No link.

### `src/routes/_authenticated/nutrition.tsx`
Insert banner directly below the top metric cards grid (before "Detailed Demographic Breakdowns").
Text: `Data Source: Kenya IPC (Integrated Food Security Phase Classifications)`
No link.

## Out of scope

Mpox, Measles, Anthrax (already done), Overview page, all other cards/charts/tables/layouts.
