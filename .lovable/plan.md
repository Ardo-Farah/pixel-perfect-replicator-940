## Intro Card Tweaks

Update only the intro card on `src/routes/_authenticated/index.tsx`.

### Changes
- Background: change `bg-secondary-fixed/40` → `bg-card` (white, matching other cards).
- Keep the existing border and squared corners; keep Source Sans Pro.
- Title "Current Health Emergencies": replace `text-primary` with inline `style={{ color: '#009ADE' }}` (WHO blue). Keep it centered.
- Paragraph: remove `text-center` from the wrapper and change paragraph classes to right-align (`text-right`, drop `mx-auto`, keep `max-w-3xl ml-auto` so it sits at the right edge).

### Out of scope
All other cards, grading row, disease cards, map, footer.
