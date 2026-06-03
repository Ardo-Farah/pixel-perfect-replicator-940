-- page_content had RLS enabled but no policies, so it required the service-role
-- key just to read. Add documents-style policies: any signed-in user can read,
-- only admins can write. This lets the app read/write content with the user's
-- own JWT (no service role) and removes page_content from the service-role path.
alter table public.page_content enable row level security;

drop policy if exists "Authenticated read page_content" on public.page_content;
create policy "Authenticated read page_content"
  on public.page_content for select
  to authenticated
  using (true);

drop policy if exists "Admins insert page_content" on public.page_content;
create policy "Admins insert page_content"
  on public.page_content for insert
  to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins update page_content" on public.page_content;
create policy "Admins update page_content"
  on public.page_content for update
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins delete page_content" on public.page_content;
create policy "Admins delete page_content"
  on public.page_content for delete
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));
