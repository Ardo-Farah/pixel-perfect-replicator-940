-- Mirror of the live migration applied to project xewepnpqhwxsqiqhbfyr on
-- 2026-06-05 (the live DB is authoritative; this file is for repo history).
--
-- Adds three lean disease sections (Ebola/BVD, Cholera, Dengue) as anthrax-style
-- array tables and removes the Anthrax section (its table had 0 rows).
-- RLS mirrors the other disease tables: authenticated SELECT only; writes go
-- through the service role (process-upload edge fn), which bypasses RLS.

create table if not exists public.ebola_data (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports(id) on delete cascade,
  county text,
  sub_county text,
  cases integer,
  deaths integer,
  cfr numeric,
  response_updates text,
  prompt_action text,
  response_activities text,
  gaps_next_steps text,
  created_at timestamptz not null default now()
);
alter table public.ebola_data enable row level security;
create policy "ebola_select" on public.ebola_data for select to authenticated using (true);
create index if not exists ebola_data_report_id_idx on public.ebola_data(report_id);

create table if not exists public.cholera_data (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports(id) on delete cascade,
  county text,
  sub_county text,
  cases integer,
  deaths integer,
  cfr numeric,
  response_updates text,
  prompt_action text,
  response_activities text,
  gaps_next_steps text,
  created_at timestamptz not null default now()
);
alter table public.cholera_data enable row level security;
create policy "cholera_select" on public.cholera_data for select to authenticated using (true);
create index if not exists cholera_data_report_id_idx on public.cholera_data(report_id);

create table if not exists public.dengue_data (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports(id) on delete cascade,
  county text,
  sub_county text,
  cases integer,
  deaths integer,
  cfr numeric,
  response_updates text,
  prompt_action text,
  response_activities text,
  gaps_next_steps text,
  created_at timestamptz not null default now()
);
alter table public.dengue_data enable row level security;
create policy "dengue_select" on public.dengue_data for select to authenticated using (true);
create index if not exists dengue_data_report_id_idx on public.dengue_data(report_id);

drop table if exists public.anthrax_data cascade;
