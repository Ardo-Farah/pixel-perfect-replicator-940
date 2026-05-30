Edit `src/routes/_authenticated/profile.tsx` only:

1. **Remove the "Personal Details" card** entirely.
2. **Remove the "Regional Jurisdiction" card** entirely (drop the `counties` rendering block and the "View Interactive Map" link).
3. **Rework the "Professional Profile" card**:
   - Rename the title to `Profile — {full name}` (falls back to "Not set" when name is missing).
   - Keep **Staff ID** with its Edit affordance.
   - Keep **Access Level** but change the two options from `Coordinator / Admin` to **`User / Admin`** (default `user`).
   - Rename **Department** → **Unit** (still bound to `profile.department`, Edit affordance preserved).
   - Remove the **Reports To** field.
   - Add a link **"Go to Admin Dashboard →"** at the bottom of the card pointing to `/admin` (only useful for admins, but shown as requested).
4. Grid: after removing two cards, change the three-column grid wrapper to a single full-width column so the remaining Profile card sits cleanly above the existing Recent Actions / Security row.
5. Leave the header banner, Edit Profile dialog, Recent Actions, Security & Privacy, footer, logs dialog, and all data loading logic untouched.

No DB schema changes, no other files touched.