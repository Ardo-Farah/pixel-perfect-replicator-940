# Admin schema SQL for external project `xewepnpqhwxsqiqhbfyr`

Paste the block below into the SQL editor at
`https://supabase.com/dashboard/project/xewepnpqhwxsqiqhbfyr/sql` and run it once.
Everything is idempotent (`IF NOT EXISTS` / `DROP POLICY IF EXISTS` / `CREATE OR REPLACE`), so it's safe to re-run.

## What it does

- Creates enum `app_role` (`admin`, `user`)
- Creates `public.user_roles` with grants + RLS (users read own; admins manage all)
- Creates `public.has_role(uuid, app_role)` security-definer function, locked down so only `authenticated` / `service_role` can execute
- Creates `public.audit_log` with grants + RLS (admins read; authenticated insert own)
- Seeds the admin row for `ardoumar6@gmail.com` (works because you're already signed up)

## The SQL

```sql
-- 1. Enum
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- 2. user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

-- 3. has_role (security definer, locked down)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- 4. RLS policies on user_roles (depend on has_role, so created after it)
drop policy if exists "Users view own roles" on public.user_roles;
create policy "Users view own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5. audit_log table
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

alter table public.audit_log enable row level security;

drop policy if exists "Admins view audit log" on public.audit_log;
create policy "Admins view audit log"
on public.audit_log for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Authenticated insert audit" on public.audit_log;
create policy "Authenticated insert audit"
on public.audit_log for insert to authenticated
with check (auth.uid() = user_id);

-- 6. Seed admin for ardoumar6@gmail.com
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'ardoumar6@gmail.com'
on conflict (user_id, role) do nothing;
```

## Verify

After running, this should return one row:

```sql
select u.email, r.role
from public.user_roles r
join auth.users u on u.id = r.user_id
where u.email = 'ardoumar6@gmail.com';
```

## Notes

- I deliberately skipped `profiles` and `handle_new_user` — the error you hit was only about `user_roles`, and your project knowledge implies `profiles` may already exist there with a different shape. If you want me to also add a profile/trigger block, say the word and I'll append it.
- No app/code changes are part of this plan — the dashboard already reads `user_roles` via `useIsAdmin`, and the admin pages are still on mock data per the previous step.

Approve to switch to build mode (no files will change — this is a copy/paste plan), or tell me to revise.
