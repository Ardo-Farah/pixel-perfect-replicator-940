## Goal

Add authentication (login + signup) and a floating AI chat assistant (bottom-right, opens a side panel) that can answer questions about IDSR/disease data and render data widgets (charts/tables) inline. Keep the existing dashboard UI exactly as-is — only add new surfaces and wire them in.

## 1. Enable Lovable Cloud

Required for auth + persisted chat history. This provisions Supabase (auth, DB) and `LOVABLE_API_KEY` for the AI Gateway.

## 2. Auth pages (new routes, do not touch dashboard styling)

Built to match the reference `login_who_kenya_health_emergencies/code.html` mock (Material 3 tokens already in `styles.css`, WHO logo header, "Health Emergencies Portal" subtitle, info box, footer, support FAB suppressed on auth pages).

- `src/routes/login.tsx` — email + password sign-in, "Forgot?" link, "Trust this device" checkbox (cosmetic). Open signup link to `/signup`.
- `src/routes/signup.tsx` — same card style; fields: full name, official email, password, confirm password. Open signup (anyone can register). Calls `supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: window.location.origin } })`.
- `src/routes/forgot-password.tsx` — email entry → `resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`.
- `src/routes/reset-password.tsx` — public route; on `type=recovery` hash, shows new-password form → `supabase.auth.updateUser({ password })`.

Logo: existing WHO logo at `src/assets/who-kenya-logo.png` (no replacement).

## 3. Route protection

- `src/routes/_authenticated.tsx` — pathless layout route with `beforeLoad` that redirects to `/login?redirect=...` if no session, renders `<Outlet />` otherwise.
- Move all dashboard routes under it by renaming: `index.tsx` → `_authenticated/index.tsx`, plus `mpox.tsx`, `measles.tsx`, `anthrax.tsx`, `floods.tsx`, `idsr.tsx`, `nutrition.tsx`, `trends.tsx`, `support.tsx` → `_authenticated/<same>.tsx`. No content/UI changes inside these files. TanStack Router regenerates the route tree automatically.
- `src/routes/__root.tsx` — add a `useEffect` with `supabase.auth.onAuthStateChange` to invalidate the router on sign-in/out (no UI changes).
- Add a "Sign out" item to the existing sidebar profile block in `AppShell.tsx` (small `logout` icon button next to the avatar, same tokens — no layout change).

## 4. Database — chat persistence + profile

Two new tables (RLS enabled, scoped to `auth.uid()`):

- `profiles` — `id uuid PK references auth.users on delete cascade`, `full_name text`, `created_at`. Trigger `handle_new_user` inserts a row on signup using `raw_user_meta_data->>'full_name'`.
- `chat_messages` — `id uuid PK`, `user_id uuid references auth.users`, `role text check in ('user','assistant')`, `content text`, `parts jsonb` (stores AI SDK message parts, including data-widget parts), `created_at timestamptz default now()`.

RLS: users can `select/insert/update/delete` only `where user_id = auth.uid()`. Index on `(user_id, created_at)`.

(No `user_roles` table needed — single role, all authenticated users get full access.)

## 5. Floating AI chat assistant

Mounted inside `AppShell.tsx` so it appears on every protected page (not on `/login`, `/signup`, `/reset-password`).

UI (new files, dark-on-surface tokens — does not alter dashboard styles):

- `src/components/chat/ChatLauncher.tsx` — fixed `bottom-6 right-6` round button (`support_agent` icon, `bg-primary text-on-primary`, subtle pulse dot for unread). Toggles panel.
- `src/components/chat/ChatPanel.tsx` — slides in from right, `w-[420px]` desktop, full-width on mobile, uses existing `Sheet` primitive. Header: "WHO Kenya Assistant" + close. Body: scrollable message list. Footer: textarea + send button.
- `src/components/chat/MessageBubble.tsx` — renders `message.parts`: text parts via `react-markdown`; data-widget parts via `<DataWidget>`.
- `src/components/chat/DataWidget.tsx` — renders inline widgets matching the screenshot (titled card, horizontal bar list w/ values, callout line, action row: PNG / Excel / Show on map / scroll-down). Supports widget types `bar_by_county`, `trend_line`, `table`, `map_hint`.
- Quick-action chips above the input: "Mpox trend last 6 weeks", "Flood deaths by region", "Show Nairobi Mpox map", "Mpox new cases by county this week".

Frontend chat wiring uses AI SDK UI (`useChat` + `DefaultChatTransport` pointed at `/api/chat`); render via `message.parts`; show "Thinking…" shimmer on `status === "submitted"`. Persistence is one conversation per user (no thread list), loaded on panel open via a server fn.

## 6. AI backend (Lovable AI Gateway)

- `src/lib/ai-gateway.ts` — `createLovableAiGatewayProvider` helper (server-only).
- `src/routes/api/chat.ts` — server route, POST handler:
  - Auth: read bearer, verify with Supabase, reject 401 if no user.
  - Load prior messages from `chat_messages` for `user_id`, merge with incoming.
  - `streamText({ model: gateway("google/gemini-3-flash-preview"), system, messages, tools, stopWhen: stepCountIs(50) })`.
  - `toUIMessageStreamResponse({ originalMessages, onFinish: save user + assistant rows to `chat_messages` })`.
- System prompt: "You are the WHO Kenya Health Emergencies assistant. Answer questions about IDSR data: Mpox, Measles, Anthrax, Floods, Nutrition. When users ask for breakdowns, trends, or maps, call the appropriate tool to render a widget."
- Tools (Zod schemas; return compact JSON the UI renders as widget parts via `tool({ execute })`):
  - `getCasesByCounty({ disease, week })` → returns `{ type: 'bar_by_county', title, items: [{label, value}], callout }`
  - `getTrend({ disease, weeks })` → `{ type: 'trend_line', title, series, callout }`
  - `getRegionalDeaths({ disease })` → `{ type: 'bar_by_region', ... }`
  - `getMapHint({ disease, area })` → `{ type: 'map_hint', area, note }`
  - Initial implementation uses the same static dashboard fixtures already used in the route files (extracted into `src/lib/idsr-data.ts`).
- `src/lib/chat.functions.ts` — `getChatHistory` (auth-protected `createServerFn` returning the user's messages as `UIMessage[]`) and `clearChatHistory`.

## 7. Files added / edited

Added:
- `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/forgot-password.tsx`, `src/routes/reset-password.tsx`
- `src/routes/_authenticated.tsx`
- `src/routes/api/chat.ts`
- `src/lib/ai-gateway.ts`, `src/lib/idsr-data.ts`, `src/lib/chat.functions.ts`
- `src/components/chat/ChatLauncher.tsx`, `ChatPanel.tsx`, `MessageBubble.tsx`, `DataWidget.tsx`
- Supabase migration: `profiles`, `chat_messages`, RLS policies, `handle_new_user` trigger

Edited (minimal, no visual change to existing UI):
- `src/components/AppShell.tsx` — mount `<ChatLauncher />`, add sign-out icon button in profile block
- `src/routes/__root.tsx` — add `onAuthStateChange` listener that invalidates router
- Move dashboard route files into `_authenticated/` subdirectory (content unchanged)

Dependencies to add: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod` (likely already present), `react-markdown`.

## Out of scope (per request)

- No changes to existing dashboard layouts, colors, components, sidebar logo, or stat cards.
- No voice input.
- No admin/role system.
- No multi-thread chat history (single rolling conversation per user).
