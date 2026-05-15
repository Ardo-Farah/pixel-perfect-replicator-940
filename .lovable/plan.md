## Replace logo with the official WHO Kenya logo

### Where the logo appears
- The only logo in the app is in the sidebar header of `src/components/AppShell.tsx` — currently a cyan rounded square with the Material Symbols `public` globe icon, next to "WHO Kenya / Health Surveillance" text.

### Plan
1. Copy the uploaded image to `src/assets/who-kenya-logo.jpg` so it is bundled by Vite.
2. In `src/components/AppShell.tsx`:
   - Import the logo: `import logo from "@/assets/who-kenya-logo.jpg"`.
   - Replace the cyan icon block + the two text lines ("WHO Kenya" / "Health Surveillance") with a single `<img src={logo} alt="World Health Organization Kenya" />` sized to fit the sidebar header (roughly 160px wide, auto height, centered). The logo already contains the WHO emblem and "World Health Organization / Kenya" wordmark, so the duplicate text is removed.
3. No other files contain a logo; the `WHO Kenya Health Emergencies` strings in the top bar and page titles are headings, not logos, and stay as-is.

### Notes
- The asset is JPG with a solid cyan background, matching the uploaded file. If a transparent version is desired later, it can be swapped without touching layout.
