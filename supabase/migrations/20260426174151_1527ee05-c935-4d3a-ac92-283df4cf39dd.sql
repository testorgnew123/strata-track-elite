-- =================================================================
-- Notification templates (admin-editable)
-- =================================================================
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  kind public.notification_kind not null unique,
  subject text not null,
  body_template text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_templates enable row level security;

create trigger notification_templates_updated_at
  before update on public.notification_templates
  for each row execute function public.update_updated_at_column();

create policy "admins read templates" on public.notification_templates
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins manage templates" on public.notification_templates
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.notification_templates (kind, subject, body_template) values
  ('milestone_pending_ack', 'A milestone has been completed', 'The "{{milestone}}" milestone for your project {{project}} has been marked complete. Please review and acknowledge it in your portal.'),
  ('visit_reminder', 'Your site visit is coming up', 'Your requested site visit for {{project}} on {{date}} is approaching. Please confirm if anything has changed.'),
  ('query_reply', 'New reply on your query', 'You have a new reply on "{{subject}}" for {{project}}. Open the portal to read it.'),
  ('document_added', 'A new document is available', 'A new document "{{title}}" was added to {{project}}. Sign in to view it.'),
  ('progress_added', 'New progress update', 'A new progress update was posted on {{project}}: {{caption}}'),
  ('handover_ready', 'Your project is ready for handover', '{{project}} is ready for handover. Please book a final walkthrough through your portal.');

-- =================================================================
-- Email send log (read-only for admins; system inserts only)
-- =================================================================
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  kind public.notification_kind not null,
  subject text not null,
  status text not null default 'queued', -- queued | sent | failed | skipped
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

alter table public.email_log enable row level security;
create index idx_email_log_created on public.email_log(created_at desc);

create policy "admins read email log" on public.email_log
  for select to authenticated using (public.is_admin(auth.uid()));
-- Inserts are done by trigger functions (SECURITY DEFINER), no INSERT policy needed.

-- =================================================================
-- Trigger functions: in-app notification fan-out
-- =================================================================

-- Helper: project clients
create or replace function public._project_client_ids(_project_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select pm.user_id
  from public.project_members pm
  where pm.project_id = _project_id and pm.role = 'client'::public.app_role
$$;

-- Helper: all admins
create or replace function public._admin_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.user_roles where role = 'admin'::public.app_role
$$;

-- Milestone completed → notify project clients
create or replace function public.notify_on_milestone_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj_name text;
  client_id uuid;
begin
  if new.status = 'completed'::public.milestone_status
     and (old.status is null or old.status <> 'completed'::public.milestone_status) then
    select name into proj_name from public.projects where id = new.project_id;
    for client_id in select * from public._project_client_ids(new.project_id) loop
      insert into public.notifications (recipient_id, project_id, kind, title, body, link_to)
      values (
        client_id,
        new.project_id,
        'milestone_pending_ack',
        'Milestone completed: ' || new.title,
        'The "' || new.title || '" milestone for ' || coalesce(proj_name, 'your project') || ' has been completed. Please acknowledge it.',
        '/portal/milestones'
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_milestone_completed
  after update on public.milestones
  for each row execute function public.notify_on_milestone_completed();

-- Query reply → notify query author (if reply is from someone else)
create or replace function public.notify_on_query_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q record;
  proj_name text;
begin
  select project_id, author_id, subject into q from public.queries where id = new.query_id;
  if q.author_id is null or q.author_id = new.author_id then
    return new;
  end if;
  select name into proj_name from public.projects where id = q.project_id;
  insert into public.notifications (recipient_id, project_id, kind, title, body, link_to)
  values (
    q.author_id,
    q.project_id,
    'query_reply',
    'New reply: ' || q.subject,
    'You have a new reply on your query for ' || coalesce(proj_name, 'your project') || '.',
    '/portal/queries'
  );
  return new;
end;
$$;

create trigger trg_query_reply
  after insert on public.query_replies
  for each row execute function public.notify_on_query_reply();

-- Site visit requested → notify admins
create or replace function public.notify_on_site_visit_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
  proj_name text;
begin
  if new.status <> 'requested'::public.visit_status then
    return new;
  end if;
  select name into proj_name from public.projects where id = new.project_id;
  for admin_id in select * from public._admin_ids() loop
    insert into public.notifications (recipient_id, project_id, kind, title, body, link_to)
    values (
      admin_id,
      new.project_id,
      'visit_reminder',
      'Site visit requested for ' || coalesce(proj_name, 'a project'),
      'A client has requested a site visit on ' || to_char(new.requested_date, 'DD Mon YYYY') || coalesce(' (' || new.requested_slot || ')', '') || '. Please confirm.',
      '/admin/projects'
    );
  end loop;
  return new;
end;
$$;

create trigger trg_site_visit_requested
  after insert on public.site_visits
  for each row execute function public.notify_on_site_visit_request();

-- Project moved to handover → notify project clients
create or replace function public.notify_on_handover_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_id uuid;
begin
  if new.status = 'handover'::public.project_status
     and (old.status is null or old.status <> 'handover'::public.project_status) then
    for client_id in select * from public._project_client_ids(new.id) loop
      insert into public.notifications (recipient_id, project_id, kind, title, body, link_to)
      values (
        client_id,
        new.id,
        'handover_ready',
        new.name || ' is ready for handover',
        'Your project is ready for the handover walkthrough. Open the portal to share your feedback and refer a friend.',
        '/portal/readiness'
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_project_handover
  after update on public.projects
  for each row execute function public.notify_on_handover_status();