## Replace sidebar logo with WHO Kenya logo

1. Copy the uploaded logo from `user-uploads://image.png` to `src/assets/who-kenya-logo.png`.
2. Update `src/components/AppShell.tsx` sidebar header:
   - Remove the current placeholder block (cyan square with `public` Material icon + "WHO Kenya / Health Surveillance" text).
   - Replace with an `<img>` importing the new logo, sized to match the current header footprint (~140px wide, centered, matching prior dimensions referenced in the hydration error).
   - Keep the surrounding container padding (`px-6 py-7`) so sidebar layout is unchanged.
3. Verify no hydration mismatch (use a single consistent markup, no SSR/client branching, no cache-busting query strings).