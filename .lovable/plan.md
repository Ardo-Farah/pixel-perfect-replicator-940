Edit only `src/routes/_authenticated/idsr.tsx`.

### 1. Replace `<ul className="list-disc ...">` bullets with small blue square markers

For these four `SectionCard`s:
- Overview of key indicators of IDSR, Kenya from Epi week 1–18, 2026
- IDSR Completeness and timeliness per county, Kenya, Epi week 18, 2026
- Reporting rate per County in the past 4 weeks
- Event based surveillance, Kenya — CEBS 13th to 19th April

Swap the `<ul className="list-disc space-y-1 pl-5 ...">` with `<ul className="space-y-2">` and render each `<li>` as a flex row containing a 8×8 px solid square in `bg-primary` (the same dark navy used by the IDSR Response Updates icon backgrounds — the `primary` token) followed by the text. Match the look of the Response Updates list (vertical rhythm, no disc) but use a small square marker instead of a circular icon — no icons.

Example shape:
```tsx
<li className="flex gap-3">
  <span className="mt-2 h-2 w-2 shrink-0 bg-primary" aria-hidden />
  <span className="text-body-md text-on-surface">…</span>
</li>
```

Leave the Hospital Event-based surveillance bullets unchanged (user did not list it).

### 2. Add "View Detailed Report →" action to the same four sections

Use the existing `action` prop on `SectionCard`, copying the markup already used by Regional IDSR Performance:

```tsx
action={
  <button className="inline-flex items-center gap-1 text-body-md font-semibold text-primary hover:underline">
    View Detailed Report
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
  </button>
}
```

No other changes — keep all data, layout, charts, tables, colors, and the Hospital HEBS section exactly as they are.
