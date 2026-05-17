# Switch app to external Supabase project

## Important caveat

Lovable Cloud cannot be fully disconnected once enabled. The auto-managed files (`src/integrations/supabase/client.ts`, `client.server.ts`, `types.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `.env`) will keep pointing at the internal Cloud project (`ouzbtusvcbegpbdrfkhs`) and will be regenerated if edited. The clean way forward is to bypass that integration and route the app through a separate client that targets your project (`xewepnpqhwxsqiqhbfyr`).

## Plan

### 1. Configure the standalone client

Update `src/lib/supabase.ts` to point at your project. Since the anon key is a publishable key, it is safe to inline (same pattern the Lovable Cloud client uses). The file will read from `VITE_*` env vars first and fall back to inlined values:

- URL: `https://xewepnpqhwxsqiqhbfyr.supabase.co`
- Anon key: the JWT you provided ending in `…WygQI1w`

### 2. Store the service role key as a runtime secret

Add `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` via the secrets tool so it is available to server functions/routes but never bundled into the browser. (I cannot accept the raw service-role key in chat for security — I'll trigger the secure secret-entry form and you paste it there. Then I'll also need you to rotate the one you already pasted in chat from your Supabase dashboard, since it's now in message history.)

### 3. Add a server-only admin client for the external project

Create `src/lib/supabase-admin.server.ts` that builds a `createClient` with the URL + service-role key from `process.env`. Used only inside `createServerFn` handlers / server routes.

### 4. Migrate imports

Sweep the codebase and replace usages of the Lovable Cloud client with the new one:

- `@/integrations/supabase/client` → `@/lib/supabase`
- `@/integrations/supabase/client.server` → `@/lib/supabase-admin.server`

Auth middleware (`requireSupabaseAuth`) currently validates JWTs against the Cloud project. It will be re-implemented as `src/lib/auth-middleware.ts` that validates against your project's JWT secret using the new client.

### 5. Update `src/routes/api/chat.ts`

Currently uses `supabaseAdmin` from the integration to insert chat messages and decodes JWTs with the Cloud client. Repoint to the new admin/auth helpers.

### 6. Bootstrap your database

Your project currently has no tables. After the switch, run the SQL migration to create the dashboard schema (`weekly_reports`, `mpox_data`, `idsr_data`, …, all 15 tables from project knowledge) with RLS, plus the `profiles` + `chat_messages` tables and the `handle_new_user` trigger.

### 7. Verify

- Sign-up + sign-in against the new project
- One query per page (overview / mpox / idsr) returns expected empty/"no data" state
- `/api/chat` insert path writes to the new DB
- Build passes

## Files touched

- edit `src/lib/supabase.ts`
- create `src/lib/supabase-admin.server.ts`
- create `src/lib/auth-middleware.ts`
- edit every file importing `@/integrations/supabase/client*` (login, signup, profile, dashboard pages, chat assistant, route guards, chat API)
- new SQL migration for schema

## Untouched (managed by Lovable Cloud, will keep pointing at internal project but become unused)

- `src/integrations/supabase/*`
- `.env`
- `supabase/config.toml`

## What I need from you to proceed

1. Confirm you want to bootstrap the full dashboard schema (15 tables) on the new project, or only a subset.
2. **Rotate the service-role key you pasted** — it's now in chat history. Generate a new one in Supabase → Project Settings → API → Reset service_role key, then enter it via the secure secret form I'll open.
