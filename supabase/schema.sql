-- VELTRIX additional public application schema.
-- Safe to re-run: tables, indexes and policies are created idempotently.

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  service_interest text not null default '',
  preferred_date date,
  preferred_time text not null default '',
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_name_length check (char_length(trim(name)) between 2 and 120),
  constraint booking_email_length check (char_length(trim(email)) between 5 and 254)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  status text not null default 'active' check (status in ('active','unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  summary text not null default '',
  status text not null default 'in_progress' check (status in ('planning','in_progress','review','completed','on_hold')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_type text not null default 'page_view' check (event_type in ('page_view','quote_open','inquiry_submit')),
  path text not null check (char_length(path) between 1 and 500),
  session_id text not null check (char_length(session_id) between 8 and 100),
  created_at timestamptz not null default now()
);

create index if not exists client_projects_client_user_id_idx on public.client_projects(client_user_id);
create index if not exists project_updates_project_id_idx on public.project_updates(project_id);

alter table public.booking_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.client_projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.site_events enable row level security;

grant select, insert, update, delete on public.booking_requests to anon, authenticated;
grant select, insert, update, delete on public.newsletter_subscribers to anon, authenticated;
grant select, insert, update, delete on public.client_projects to authenticated;
grant select, insert, update, delete on public.project_updates to authenticated;
grant select, insert on public.site_events to anon, authenticated;
grant usage, select on sequence public.site_events_id_seq to anon, authenticated;

drop policy if exists "Public can request bookings" on public.booking_requests;
create policy "Public can request bookings" on public.booking_requests for insert to anon
with check (char_length(trim(name)) between 2 and 120 and char_length(trim(email)) between 5 and 254);
drop policy if exists "Admins manage booking requests" on public.booking_requests;
create policy "Admins manage booking requests" on public.booking_requests for all to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin')
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');

drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Public can subscribe to newsletter" on public.newsletter_subscribers for insert to anon
with check (char_length(trim(email)) between 5 and 254 and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$');
drop policy if exists "Admins manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins manage newsletter subscribers" on public.newsletter_subscribers for all to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin')
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');

drop policy if exists "Clients can read own projects" on public.client_projects;
create policy "Clients can read own projects" on public.client_projects for select to authenticated
using (client_user_id = (select auth.uid()) or coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
drop policy if exists "Admins manage client projects" on public.client_projects;
drop policy if exists "Admins create client projects" on public.client_projects;
create policy "Admins create client projects" on public.client_projects for insert to authenticated
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
drop policy if exists "Admins update client projects" on public.client_projects;
create policy "Admins update client projects" on public.client_projects for update to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin')
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
drop policy if exists "Admins delete client projects" on public.client_projects;
create policy "Admins delete client projects" on public.client_projects for delete to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');

drop policy if exists "Clients read own project updates" on public.project_updates;
create policy "Clients read own project updates" on public.project_updates for select to authenticated
using (exists (select 1 from public.client_projects p where p.id = project_id and (p.client_user_id = (select auth.uid()) or coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin')));
drop policy if exists "Admins manage project updates" on public.project_updates;
drop policy if exists "Admins create project updates" on public.project_updates;
create policy "Admins create project updates" on public.project_updates for insert to authenticated
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
drop policy if exists "Admins update project updates" on public.project_updates;
create policy "Admins update project updates" on public.project_updates for update to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin')
with check (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
drop policy if exists "Admins delete project updates" on public.project_updates;
create policy "Admins delete project updates" on public.project_updates for delete to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');

drop policy if exists "Public can record anonymous site events" on public.site_events;
create policy "Public can record anonymous site events" on public.site_events for insert to anon, authenticated
with check (event_type in ('page_view','quote_open','inquiry_submit') and char_length(path) between 1 and 500 and char_length(session_id) between 8 and 100);
drop policy if exists "Admins can read site events" on public.site_events;
create policy "Admins can read site events" on public.site_events for select to authenticated
using (coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = 'admin');
