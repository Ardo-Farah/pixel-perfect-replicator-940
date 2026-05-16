## Goal
Add the floating Clinical Assistant chat (bottom-right) that's available on every dashboard page, matching the screenshot style. Backend (`/api/chat`, `chat_messages` table, history server fns, IDSR tools) is already in place — this plan only adds the frontend.

## Files
**Create** `src/components/chat/ChatAssistant.tsx` — single file containing:
- `ChatLauncher` — round FAB fixed at `bottom-6 right-6`, primary-colored, sparkle icon, pulse dot when there are unread assistant messages while closed.
- `ChatPanel` — fixed bottom-right popup, ~380×560px (full-width minus 24px on mobile, max-h 80vh), themed to match the screenshot:
  - **Header**: dark `bg-primary` band, robot icon avatar, "Clinical Assistant" + green ONLINE dot, close (×) and clear-history (trash) icon buttons.
  - **Body**: scrollable. Assistant messages are plain text on surface (no bubble) rendered with `react-markdown`. User messages are right-aligned `bg-primary text-on-primary` rounded bubbles. Tool parts render as a `DataWidget` card.
  - **DataWidget** (inline component) — renders 4 tool results:
    - `getCasesByCounty` → titled card with horizontal bar list (county + value bar).
    - `getTrend` → mini sparkline / week labels with values.
    - `getDeathsByRegion` → bar list, error-tinted.
    - `getMapHint` → small callout card with map icon + "View on map" link to the relevant disease page.
  - **Quick-action chips** (only when no messages): "Mpox trend last 6 weeks", "Flood deaths by region", "Measles cases by county", "Show Mpox map for Nairobi".
  - **Composer**: rounded pill input "Type your query…" + send icon button. Disabled while `status` is `submitted`/`streaming`. Loading shimmer ("Thinking…") shown while submitted before tokens stream.

**Edit** `src/components/AppShell.tsx` — mount `<ChatAssistant />` once at the root of the shell so it floats over every authenticated page (Summary, Mpox, Measles, Anthrax, Floods, IDSR, Nutrition, Trends, Support, Profile). Auth/login pages do not render `AppShell` so the chat will not appear there.

## Implementation details
- Use `useChat` from `@ai-sdk/react` with `DefaultChatTransport({ api: "/api/chat", headers })`. `headers` is a function that calls `supabase.auth.getSession()` and returns `{ Authorization: Bearer <token> }` so the server route's `getUserId` works.
- On panel open, call `getChatHistory` server fn once (single rolling conversation per user) and seed `useChat({ messages: initialMessages })`. Skip thread list — the earlier decision is single conversation per user.
- Render `message.parts`, not flat content: handle `type === "text"` (markdown) and `type === "tool-<name>"` parts (use `part.output` when `state === "output-available"`).
- Persist is automatic on the server via `onFinish` already in `/api/chat`.
- Trash icon calls `clearChatHistory` then `setMessages([])`.
- Errors (401 / 429 / 402) → small inline error line above composer.
- All styling uses existing semantic tokens (`bg-primary`, `text-on-primary`, `bg-surface-container-lowest`, `border-outline-variant`, `text-secondary`, `bg-error-container`) — no new colors.

## Out of scope
No backend changes, no new tables, no voice input, no thread list, no changes to existing dashboard pages or sidebar/profile.
