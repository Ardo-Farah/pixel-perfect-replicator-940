## Changes

### 1. Summary page stat cards (`src/routes/_authenticated/index.tsx`)
The current `MetricCardWithBar` uses absolute-positioned subtext + progress bar, which causes overlap (image-6). Redesign to match the cleaner IDSR-style cards (image-7):

- Label top-left, icon top-right (same row).
- Large bold number.
- Small subtext on its own line directly below (normal flow, no absolute positioning).
- Drop the progress bar.
- Auto height, consistent padding, `min-w-0` retained so they never clip in the 4-column grid.

Keep the existing grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` and all data/labels/colors unchanged.

### 2. Floods page card arrangement (`src/routes/_authenticated/floods.tsx`)
Change the 6 metric cards from a 4-up + 2-below layout to a clean 3+3 grid:
- `md:grid-cols-2 lg:grid-cols-4` → `md:grid-cols-2 lg:grid-cols-3`
- No other changes; same cards, same content, same styling.

## Out of scope
No theme/token changes, no other page changes, no sidebar/logo/profile changes.
