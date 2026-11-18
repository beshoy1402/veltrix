-- VELTRIX team workspaces foundation
create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  department text not null check (department in ('marketing','developer','designer','admin')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  project_id uuid references public.client_projects(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_tasks_assigned_idx on public.team_tasks(assigned_to, status, due_date);
create index if not exists team_tasks_department_idx on public.team_tasks(department, status);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 180),
  channel text not null default 'Instagram',
  status text not null default 'draft' check (status in ('draft','planned','active','paused','completed')),
  budget_egp numeric(12,2) not null default 0 check (budget_egp >= 0),
  starts_on date,
  ends_on date,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketing_campaigns_status_idx on public.marketing_campaigns(status, starts_on);

create table if not exists public.design_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text not null default '',
  file_url text,
  file_path text,
  project_id uuid references public.client_projects(id) on delete set null,
  status text not null default 'working' check (status in ('working','review','approved','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists design_assets_status_idx on public.design_assets(status, created_at desc);

create table if not exists public.team_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  body text not null default '',
  audience text not null default 'all' check (audience in ('all','marketing','developer','designer')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.team_tasks enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.design_assets enable row level security;
alter table public.team_announcements enable row level security;

drop policy if exists "Admins manage team tasks" on public.team_tasks;
create policy "Admins manage team tasks" on public.team_tasks for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Team members read assigned tasks" on public.team_tasks;
create policy "Team members read assigned tasks" on public.team_tasks for select to authenticated
using (assigned_to = (select auth.uid()) or created_by = (select auth.uid()));

drop policy if exists "Admins manage marketing campaigns" on public.marketing_campaigns;
create policy "Admins manage marketing campaigns" on public.marketing_campaigns for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Marketing team manage campaigns" on public.marketing_campaigns;
create policy "Marketing team manage campaigns" on public.marketing_campaigns for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'marketing')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'marketing');

drop policy if exists "Admins manage design assets" on public.design_assets;
create policy "Admins manage design assets" on public.design_assets for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Designers read and manage design assets" on public.design_assets;
create policy "Designers read and manage design assets" on public.design_assets for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'designer')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'designer');

drop policy if exists "Admins manage team announcements" on public.team_announcements;
create policy "Admins manage team announcements" on public.team_announcements for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Team reads relevant announcements" on public.team_announcements;
create policy "Team reads relevant announcements" on public.team_announcements for select to authenticated
using (audience = 'all' or audience = (select auth.jwt()->'app_metadata'->>'role'));

drop policy if exists "Admins manage payment submissions" on public.payment_submissions;
create policy "Admins manage payment submissions" on public.payment_submissions for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Admins manage support conversations" on public.support_conversations;
create policy "Admins manage support conversations" on public.support_conversations for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "Admins manage support messages" on public.support_messages;
create policy "Admins manage support messages" on public.support_messages for all to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
