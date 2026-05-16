## Goal
Add an Official Profile page matching the uploaded screenshot, and a sign-out button — without changing the existing theme, sidebar logo, or design tokens.

## Scope
1. **New route**: `src/routes/_authenticated/profile.tsx` rendered inside `AppShell` so the sidebar, top bar, and existing styling stay identical.
2. **Sidebar**: the "Official Profile" footer block already exists — wrap it in a `<Link to="/profile">` so it becomes the active entry that highlights when on the profile page (no visual change to the block itself).
3. **Sign out**: add a small icon button next to the "Official Profile" footer in `AppShell.tsx` (logout icon, themed with `text-on-surface-variant hover:bg-surface-container-low`) that calls `supabase.auth.signOut()` and navigates to `/login`. Tooltip: "Sign out". This keeps the existing layout, just adds one icon button — no theme change.

## Profile page sections (exact match to screenshot)
Built with existing tokens (`bg-surface-container-lowest`, `border-outline-variant`, `text-primary`, `text-secondary`, etc.) and Material Symbols icons already used in the app. No new colors.

- **Header banner card**: light gradient strip + avatar (placeholder initials circle using `bg-primary` since we don't ship a real photo), name "Dr. Richard C." with green ACTIVE pill, role line, and right-side `Edit Profile` (primary) + `View Logs` (outlined) buttons.
- **Three-column grid** (responsive: 1 col mobile, 2 md, 3 lg):
  - **Personal Details** card — Full Name, Official Email, Phone Number, Primary Station.
  - **Professional Profile** card — Staff ID, Access Level (Coordinator / Admin toggle pills, Coordinator active), Department, Reports To.
  - **Regional Jurisdiction** card — list of counties (Nakuru, Baringo, Narok, Kericho) each with a green check, plus a "View Interactive Map" link.
- **Two-column grid** below:
  - **Recent Actions** timeline (3 items with icons, titles, descriptions, relative times, "VIEW ALL ACTIVITY" link).
  - **Security & Privacy** card — Two-Factor toggle (on), Login Notifications toggle (off), "Change Password" outlined button, "Sign Out of All Devices" destructive button (uses `bg-error-container text-on-error-container`).
- **Footer line** inside the page: "System Status: STABLE · Version 2.4.1-LTS" on the left, "Privacy Policy · Technical Support · Incident Reporting" on the right.

All content is static (hard-coded) — matches the reference exactly. No DB writes, no edits to existing dashboard pages.

## Files
- **Create** `src/routes/_authenticated/profile.tsx`
- **Edit** `src/components/AppShell.tsx` — wrap profile footer block in `<Link to="/profile">`, add sign-out icon button beside it.

## Out of scope
- No changes to existing dashboard pages, sidebar logo, stat cards, or chat assistant work.
- Toggles and "Edit Profile" / "Change Password" are visual only for now (no backend wiring) — confirm if you want them functional later.
