
## Intro Card Refinements

Update only the intro card on `src/routes/_authenticated/index.tsx`.

### Changes
- Remove the left navy border accent (`border-l-4 border-l-primary`).
- Square the corners (override `Card`'s `rounded-xl` with `rounded-none`).
- Center the text horizontally.
- Add an H2 title above the paragraph: **"Current Health Emergencies"** in the same dark navy used by page titles like "Measles" (existing `text-primary` token).
- Apply Source Sans Pro to the card (title + body).

### Font wiring
- Install `@fontsource/source-sans-pro` via `bun add`.
- Import `@fontsource/source-sans-pro/400.css` and `/700.css` in `src/main.tsx` (or whichever entry already loads fonts — will check first; if none, import in `src/styles.css` via the entry).
- Apply with an inline `style={{ fontFamily: '"Source Sans Pro", sans-serif' }}` on the intro card only (scoped to this element — does not change the global font).

### Out of scope
- All other cards, grading row, disease cards, map, footer.
- No global typography changes.
