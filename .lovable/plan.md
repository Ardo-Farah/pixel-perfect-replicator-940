## Change

Switch all bulleted summary lists in `src/routes/_authenticated/idsr.tsx` to use small squares in the light blue used by the IDSR icon backgrounds (`bg-secondary-fixed`, `#c9e6ff`).

### 1. Recolor existing square markers (8 lines)

Lines 282, 283, 314, 315, 346, 441, 442, 443 currently use:
```
<span className="mt-2 h-2 w-2 shrink-0 bg-primary" aria-hidden />
```
Change `bg-primary` → `bg-secondary-fixed`. Affects:
- Overview of key indicators (2 bullets)
- IDSR Completeness & Timeliness per county (2 bullets)
- Reporting rate per county (1 bullet)
- CEBS / Event-based surveillance summary (3 bullets)

### 2. Convert Hospital Event-based surveillance list (lines 505–509)

Replace the `list-disc` bulleted list with the same square-marker pattern:
```tsx
<ul className="space-y-2 px-10 py-5">
  <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">Mombasa HCWs reported most of the signals (31).</span></li>
  <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of signal verification: All signals verified except the one in Siaya.</span></li>
  <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 bg-secondary-fixed" aria-hidden /><span className="text-body-md text-on-surface">In terms of events investigation: Nairobi didn't hit the target.</span></li>
</ul>
```

No other content, layout, colors, or copy changes.
