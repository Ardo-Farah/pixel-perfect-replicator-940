## Fix grade summary cards on overview dashboard

**Problem:** Only the Grade 1 card renders with its color fill. Grade 3, Grade 2, Protracted, and Ungraded cards are showing as white boxes. The intended colors (from the reference screenshot) are not being painted, and text alignment varies between cards.

### What to change

**1. Force the color fills to render (all 5 cards)**

In `src/lib/disease-grades.ts`, replace the Tailwind palette classes (`bg-red-600`, `bg-orange-500`, etc.) with arbitrary-value classes using explicit hex colors from the reference screenshot. This bypasses any `bg-card` precedence issue from the shadcn `Card` base class and guarantees the paint matches the reference:

- Grade 3 → `bg-[#EF4444]` (red)
- Grade 2 → `bg-[#F97316]` (orange)
- Grade 1 → `bg-[#EAB308]` (yellow — already works, kept for consistency)
- Ungraded → `bg-[#737373]` (neutral gray)
- Protracted → `bg-[#009ADE]` (WHO blue — already set)

Also add `!` important prefix (`bg-[#EF4444]!`) or move the bg utility ahead of the Card's `bg-card` via `cn()` ordering inside `GradeCard` so tailwind-merge consistently keeps the colored fill.

**2. Match Grade 1's exact layout for all cards**

In `GradeCard` (`src/routes/_authenticated/index.tsx`, lines 316–330), keep the existing Grade 1 structure (label on top, big metric + sub label on one baseline, italic note below) but tighten alignment so all 5 cards look identical:

- Use consistent padding (`p-5`), consistent vertical gap (`gap-2`), and a fixed minimum card height so cards in the row line up regardless of note length.
- Ensure label, value, sub, and note all use the same horizontal alignment (left-aligned, matching Grade 1).
- Use `text-white` on every text element (drop the `/90`, `/95` opacity variants so contrast stays equal across all 5 colors — important for the lighter yellow and gray).

**3. No other dashboards or routes touched**

Only the 5-card summary row on the overview (`/`) changes. Disease pages, badges (`GradeBadge`), and the `disease-grades` per-disease mapping stay as-is.

### Files

- `src/lib/disease-grades.ts` — swap palette classes for hex arbitrary values
- `src/routes/_authenticated/index.tsx` — tighten `GradeCard` layout / alignment, ensure bg class wins over `bg-card`

### Out of scope

- Adding extra Protracted G1/G2/G3 cards to the row (the reference screenshot's second row is a color legend, not new dashboard cards)
- Any data / Supabase changes
- Any change to the per-disease grade mapping
