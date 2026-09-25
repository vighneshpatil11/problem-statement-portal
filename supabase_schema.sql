create extension if not exists pgcrypto;

create sequence if not exists statement_id_seq start 1;

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  statement_id text unique not null default ('B' || lpad(nextval('statement_id_seq')::text, 2, '0')),
  title text not null check (char_length(title) between 1 and 150),
  description text not null check (char_length(description) between 1 and 2000),
  creator_name text not null check (char_length(creator_name) between 1 and 100),
  creator_roll text not null check (char_length(creator_roll) between 1 and 50),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  roll_no text not null check (char_length(roll_no) between 1 and 50),
  joined_at timestamptz not null default now(),
  unique(problem_id, roll_no)
);

create index if not exists problems_created_at_idx on public.problems(created_at desc);
create index if not exists team_members_problem_id_idx on public.team_members(problem_id);

alter table public.problems enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "Public can read problems" on public.problems;
create policy "Public can read problems" on public.problems for select to anon, authenticated using (true);

drop policy if exists "Public can read interests" on public.team_members;
create policy "Public can read interests" on public.team_members for select to anon, authenticated using (true);

drop policy if exists "Public can add problems" on public.problems;
create policy "Public can add problems" on public.problems for insert to anon, authenticated with check (true);

drop policy if exists "Public can add interests" on public.team_members;
create policy "Public can add interests" on public.team_members for insert to anon, authenticated with check (exists (select 1 from public.problems p where p.id=problem_id));

-- Replace YOUR_ADMIN_EMAIL with your admin email before running.
drop policy if exists "Admin can delete problems" on public.problems;
create policy "Admin can delete problems" on public.problems for delete to authenticated
using ((auth.jwt()->>'email')='YOUR_ADMIN_EMAIL');

drop policy if exists "Admin can delete interests" on public.team_members;
create policy "Admin can delete interests" on public.team_members for delete to authenticated
using ((auth.jwt()->>'email')='YOUR_ADMIN_EMAIL');
