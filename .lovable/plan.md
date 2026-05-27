## Redesign footer card on Summary page

In `src/routes/_authenticated/index.tsx`, rework the final WHO Kenya footer Card into a cleaner 3-column layout:

**Column 1 — Contact Information** (keep existing email, phone, location items, icons in WHO blue `#009ADE`, text in `#00205c`)

**Column 2 — Follow our platforms**
- Title in WHO blue `#009ADE`
- Three circular icons: LinkedIn, Instagram, Twitter/X (using Material Symbols or inline SVG; icons in WHO blue)
- Below the icons, a link to the WHO Kenya website: `https://www.afro.who.int/countries/kenya` styled clean and clear

**Column 3 — Current communication materials**
- Title in WHO blue `#009ADE`
- Two download links: "Annual Report" and "Current EPR Bulletin" with download icon (placeholder `#` hrefs for now)

**Removed:**
- "WHO KENYA" heading + description paragraph
- "Privacy Policy · Terms of Use · Surveillance Guidelines" line

**Kept:**
- "MADE BY WHO KENYA COUNTRY OFFICE © 2026" (now centered along the bottom border)

**Styling:**
- White card background (existing), all body text uses inline `color: '#00205c'`, all section titles and icons use `#009ADE`
- Material Symbols icons for LinkedIn (`link`), Instagram (`photo_camera`) — actually use brand SVGs inline since Material Symbols lacks proper brand glyphs. Inline minimal SVGs for LinkedIn / Instagram / Twitter (X) in `currentColor` so they tint to WHO blue.
- Generous spacing, divider above the © line, no other changes to the page.

### Technical notes
- Only edits the final `<Card className="p-6">` block at the bottom of `SummaryPage` (the WHO Kenya footer). No other components or data hooks touched.
- Inline SVG brand icons avoid pulling in a new icon dependency.
