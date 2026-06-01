## Plan

The preview is not broken at the server level: the app loads, then sits briefly on the authenticated route’s `Loading…` screen before redirecting to `/login`. I’ll make that flow deterministic so users don’t think the site is hung.

### Changes
1. Update `src/routes/_authenticated.tsx`
   - Replace the 3.5-second fallback delay with an immediate auth-session check.
   - Redirect unauthenticated users to `/login` as soon as the session is known.
   - Keep the loading screen only while the session check is actively running.

2. Improve loading/error behavior
   - If the session check fails, redirect to login instead of leaving the user on `Loading…`.
   - Prevent auth state listeners from leaving stale state after unmount.

3. Verify
   - Reload `/` in the preview and confirm it reaches the sign-in page instead of appearing stuck.
   - Check console/network again for real load errors.