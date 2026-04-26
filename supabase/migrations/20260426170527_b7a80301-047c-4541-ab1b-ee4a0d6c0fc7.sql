-- ============================================================
-- ENUMS
-- ============================================================
create type public.app_role as enum ('client', 'engineer', 'admin');

create type public.project_status as enum (
  'planning',
  'in_progress',
  'on_hold',
  'handover',
  'completed'
);

create type public.app_language as enum ('en', 'hi');

-- ============================================================
-- SHARED HELPERS
-- ============================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  mobile text,
  avatar_url text,
  language public.app_language not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- USER ROLES (separate table — prevents privilege escalation)
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles WITHOUT recursing through RLS
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

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  client_display_name text,
  address text,
  status public.project_status not null default 'planning',
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  expected_handover_date date,
  cover_image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- PROJECT MEMBERS (who can access which project)
-- ============================================================
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table public.project_members enable row level security;

create index idx_project_members_user on public.project_members(user_id);
create index idx_project_members_project on public.project_members(project_id);

-- Helper to check membership without RLS recursion
create or replace function public.is_project_member(_project_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = _project_id and user_id = _user_id
  )
$$;

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index idx_audit_actor on public.audit_log(actor_id);
create index idx_audit_created on public.audit_log(created_at desc);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles
create policy "Users view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Admins insert profiles"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin(auth.uid()) or id = auth.uid());

-- user_roles
create policy "Users view own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- projects
create policy "Members or admins view projects"
  on public.projects for select
  to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(id, auth.uid()));

create policy "Admins insert projects"
  on public.projects for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admins update projects"
  on public.projects for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins delete projects"
  on public.projects for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- project_members
create policy "Members view co-members"
  on public.project_members for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or public.is_project_member(project_id, auth.uid())
  );

create policy "Admins manage members"
  on public.project_members for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- audit_log
create policy "Admins view audit"
  on public.audit_log for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Authenticated insert audit"
  on public.audit_log for insert
  to authenticated
  with check (actor_id = auth.uid());

-- ============================================================
-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, mobile)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();