## Goal
Replace every raw error message, red JSON banner, and unhandled state with consistent, WHO-Kenya-themed UI (dark navy, white, WHO blue `#0093D5`). Add modals, toasts, inline field errors, empty states, and an offline banner. Never show raw JSON or API text to users.

## Scope (files touched)

### Shared infrastructure (new)
- `src/components/feedback/ErrorModal.tsx` — themed modal: warning icon, title, friendly message, primary action button (Retry / Upload Correct File / Close). Variants: `warning | error | info`.
- `src/components/feedback/InlineErrorCard.tsx` — card with WHO-blue retry button for failed data fetches (replaces blank pages).
- `src/components/feedback/EmptyState.tsx` — illustration + message ("No report uploaded for this week yet"), reusable across pages.
- `src/components/feedback/OfflineBanner.tsx` — persistent top banner driven by `navigator.onLine` + `online/offline` events: "You are offline. Data may be outdated."
- `src/lib/error-messages.ts` — maps HTTP status → friendly copy + action (422, 415, 500, 401, network, generic).
- `src/lib/toast.ts` — thin wrapper around `sonner` enforcing rules: position bottom-right, success/info auto-dismiss 4s, errors persistent until dismissed, consistent icons (warning triangle / check / info circle).

### Toaster setup
- `src/routes/__root.tsx` — ensure `<Toaster position="bottom-right" richColors closeButton />` is mounted; add `<OfflineBanner />`.

### Upload flow (`src/context/UploadProvider.tsx`)
- Parse Edge Function response status; map to:
  - **422** → `ErrorModal` warning variant, "We couldn't read this report. Please upload the correct weekly bulletin PDF.", button "Upload Correct File" reopens file picker.
  - **415** → `ErrorModal`, lists accepted formats (PDF, DOCX).
  - **500** → `ErrorModal` with "Retry" button (re-invokes upload with same file).
  - **401** → redirect to `/login` with toast "Your session expired. Please sign in again."
  - other → generic error modal.
- Remove raw `Edge Function 500: <body>` strings from UI; keep in console only.
- On success → toast: "Report uploaded successfully for Week {n}" (week parsed from response or current).
- Replace existing `UploadBanner` red bar with the new modal + progress banner kept only for `uploading` state.

### Auth pages
- `src/routes/login.tsx` — remove red banner block. Map Supabase errors:
  - `invalid_credentials` / "Invalid login credentials" → inline message **under password field**: "Incorrect password. Please try again."
  - `user_not_found` / email-not-confirmed cases → inline message **under email field**: "No account found for this email."
  - other → toast.
- `src/routes/signup.tsx` — inline field-level errors (password mismatch under confirm field, length under password field, duplicate email under email field). Toast on unexpected failures.
- `src/routes/forgot-password.tsx` — inline error under email field; success toast "Reset link sent. Check your inbox."
- `src/routes/reset-password.tsx` — inline errors, success toast then redirect.

### Profile form (`src/routes/_authenticated/profile.tsx`)
- Field-level inline validation errors (no alerts).
- Failed save → bottom-right toast (error, persistent).
- Successful save → bottom-right toast (success, 4s auto-dismiss).

### Data-loading pages
Apply to every route under `src/routes/_authenticated/` that fetches Supabase data (`index.tsx`, `mpox.tsx`, `measles.tsx`, `idsr.tsx`, `nutrition.tsx`, `anthrax.tsx`, `floods.tsx`, `trends.tsx`):
- Wrap fetch hooks so errors render `<InlineErrorCard onRetry={...} />` instead of crashing/blank screen.
- When `data` is empty/null and not loading → render `<EmptyState />` with "No report uploaded for this week yet".
- Keep existing skeleton loading states.
- Update `src/hooks/useReport.ts` to expose `error` and `refetch` alongside `data`/`loading`.

### Chat assistant (`src/components/chat/ChatAssistant.tsx`)
- Replace any raw error bubble with friendly message + retry button.

## Design tokens (use existing `src/styles.css`)
- Primary action / icon accents: WHO blue `#0093D5` (add `--who-blue` token if missing).
- Modal surface: dark navy bg + white text (use existing `surface`/`on-surface` tokens; verify contrast).
- Icons: `material-symbols-outlined` (already used) — `warning` (errors), `check_circle` (success), `info` (neutral).

## Global rules enforced
1. No raw JSON or API text reaches users — all mapped through `error-messages.ts`.
2. Every error UI has exactly one clear action (Retry / Upload Correct File / Close / Sign in again).
3. Toasts: bottom-right, success/info 4s, errors persistent with close button.
4. Consistent iconography across all feedback components.
5. Console keeps verbose details for debugging.

## Out of scope
- No changes to charts/visualizations, business logic, Supabase schema, or Edge Functions.
- No new dependencies (sonner + lucide/material-symbols already present).

## Verification
- Trigger each scenario manually in preview: bad PDF (422 simulated), wrong file type, network offline (devtools), wrong password, empty week. Confirm themed UI, no raw text, correct action buttons.
- `bun run build` passes.