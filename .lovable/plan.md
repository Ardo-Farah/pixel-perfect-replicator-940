## Goal

Add the "Data source: Ministry of Health Kenya" banner to **Measles** and **Anthrax** pages (currently only on Mpox/IDSR), and restyle the banner on **Mpox, Measles, Anthrax** to match the new spec.

Do NOT touch IDSR, Overview, Floods, Nutrition.

## Banner spec (shared)

- Background: `#00205c` (WHO dark blue)
- Text color: white
- No database/cylinder icon
- Left side: `Data source: Ministry of Health Kenya`
- Right side: link `Click here for link` → `https://www.health.go.ke/` (opens in new tab, white underlined)
- Full-width rounded card, placed directly below the metric cards row (same position Mpox uses now)

```tsx
<div
  className="flex items-center justify-between rounded-lg px-5 py-3 text-white"
  style={{ backgroundColor: "#00205c" }}
>
  <p className="text-body-md">Data source: Ministry of Health Kenya</p>
  <a
    href="https://www.health.go.ke/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-body-md underline hover:opacity-80"
  >
    Click here for link
  </a>
</div>
```

## Changes per file

### `src/routes/_authenticated/mpox.tsx`
Replace the existing banner block (currently `bg-secondary-fixed` with a database icon) with the new spec above. Keep its position right below the top metric cards.

### `src/routes/_authenticated/measles.tsx`
Insert the new banner directly below the top row of metric cards (mirroring Mpox placement). No other changes.

### `src/routes/_authenticated/anthrax.tsx`
Insert the new banner directly below the top metric cards grid (before the "Secondary Anthrax Metrics" section). No other changes.

## Out of scope

- IDSR page banner (unchanged per prior instruction).
- Overview, Floods, Nutrition pages.
- All other cards, charts, tables, layouts.
