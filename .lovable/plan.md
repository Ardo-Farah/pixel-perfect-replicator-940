## Wire real contact links into the WHO Kenya footer

Edit only the final footer `Card` in `src/routes/_authenticated/index.tsx`.

### Contact column
- Phone: change `+254 700 000 000` → `+254 758 438 522`, wrap in `<a href="tel:+254758438522">`
- Email: wrap existing `communications_kenya@who.int` in `<a href="mailto:...">`
- Location: leave as-is

### Follow our platforms column
Add a 4th icon (Facebook) alongside LinkedIn, Instagram, Twitter. All four use the same circular WHO-blue style as the current icons.

- LinkedIn → `https://www.linkedin.com/company/whokenya`
- Instagram → `https://www.instagram.com/whoinkenya`
- Twitter → `https://x.com/WHOKenya`
- Facebook → `https://www.facebook.com/WHOKenya` (inline Facebook SVG glyph in `currentColor`)

"Visit the WHO Kenya website" link → `https://www.afro.who.int/countries/kenya`

### Current Communication Materials column
Both download links point to:
`https://www.afro.who.int/countries/kenya/publication/who-kenya-emergency-bulletin-april-2026`
- Annual Report
- Current EPR Bulletin

Open in new tab (`target="_blank" rel="noreferrer"`).

### Untouched
Card styling, colors (`#009ADE` / `#00205c`), grid layout, the bottom "MADE BY WHO KENYA COUNTRY OFFICE © 2026" line, and every other section of the page.

### Notes
- No new dependencies; Facebook icon is an inline SVG matching the existing icon pattern.
- The 3-column grid (`md:grid-cols-3`) stays — adding a 4th social icon fits within the existing "Follow" column.
