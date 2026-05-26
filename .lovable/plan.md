## Goal

Standardize the **Response Notes & Updates** and **Map of Kenya** cards across **Mpox, Anthrax, Floods, Nutrition** so they:
- Use the **Mpox visual format** — filled dark numbered circles (`01`, `02`, `03` …) for each bullet point, "Response Notes & Updates" title with the small info-circle icon, optional "Last Update" footer box.
- Use **Measles sizing** — full-width stacked layout (Map full-width on top, Response notes full-width below), not the cramped 2-column grid.

**Do NOT touch:** IDSR, Overview/Index dashboard, Measles (already correct), any metrics/charts/tables on these pages.

## Changes per file

### 1. `src/routes/_authenticated/mpox.tsx`
Bottom section currently uses `grid lg:grid-cols-2` with Map Card on left and `NotesCard` on right. Replace with:
- **Map Card full-width** — promote heading to "Geographic Mpox Distribution" with sub-line and the 3-dot legend (1-10 / 11-50 / 50+) like Measles, height `520`.
- **NotesCard full-width** below — keep the existing numbered `01/02/03` list and Last Update footer as-is (already correct format).

### 2. `src/routes/_authenticated/anthrax.tsx`
- Keep the existing "Geographic Anthrax Distribution" map card (already full-width — no change to map content).
- Replace the freeform "Response Updates" / "Prompt Action" two-column body inside `NotesCard` with a **single full-width numbered `<ol>`** styled like Mpox (filled primary circles with `01`, `02`, `03` …). Items derive from the same `response_updates` (split by newlines into numbered points) and `prompt_action` (final numbered item). If empty, keep the "No notes recorded" message.

### 3. `src/routes/_authenticated/floods.tsx`
- Replace the 2-column NotesCard body with a full-width numbered list (Mpox format). Each non-empty value from `Health Facility Status`, `Supplies & Logistics`, `Epidemiological Risks` becomes a numbered item; `prompt_action`, if present, becomes the final numbered item.

### 4. `src/routes/_authenticated/nutrition.tsx`
- Collapse the 2-column NotesCard body to a single full-width numbered `<ol>` containing all 4 existing items (Severe Food Security Crisis, IPC Phase 4, Refugee Settlement Vulnerability, Compounded Drivers) styled with the Mpox numbered-circle format. Keep the "Priority Outlook 2026" callout box below the list, full-width.

## Visual spec (shared)

```tsx
<li className="flex gap-3">
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
    {n}
  </span>
  <p className="text-body-md text-on-surface">
    <span className="font-semibold">{title}</span> {body}
  </p>
</li>
```

NotesCard wrapper unchanged; only the inner body is restructured to single-column full-width.

## Out of scope (explicit)

- IDSR page — untouched.
- Index/Overview dashboard — untouched.
- Measles — untouched (reference baseline).
- All metric cards, charts, tables, AppShell headers — untouched.
- No data model / Supabase changes.
