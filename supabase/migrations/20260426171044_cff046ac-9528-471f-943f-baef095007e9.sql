-- ============================================================
-- ENUMS
-- ============================================================
create type public.milestone_status as enum ('pending', 'in_progress', 'completed');
create type public.progress_category as enum ('structure', 'plumbing', 'electrical', 'finishing', 'exterior', 'other');
create type public.document_category as enum ('contract', 'floor_plan', 'permit', 'report', 'invoice_doc', 'other');
create type public.query_status as enum ('open', 'answered', 'closed');
create type public.query_priority as enum ('low', 'normal', 'high');
create type public.visit_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type public.readiness_status as enum ('pending', 'done', 'na');
create type public.notification_kind as enum ('milestone_pending_ack', 'visit_reminder', 'query_reply', 'document_added', 'progress_added', 'handover_ready');

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  target_date date,
  completed_at timestamptz,
  status public.milestone_status not null default 'pending',
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.milestones enable row level security;
create index idx_milestones_project on public.milestones(project_id);
create trigger milestones_updated_at before update on public.milestones
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- PROGRESS UPDATES
-- ============================================================
create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  category public.progress_category not null default 'other',
  caption text,
  photo_url text,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.progress_updates enable row level security;
create index idx_progress_project on public.progress_updates(project_id, taken_at desc);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  category public.document_category not null default 'other',
  title text not null,
  file_path text not null,
  file_size_bytes bigint,
  mime_type text,
  version int not null default 1,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create index idx_documents_project on public.documents(project_id, created_at desc);

-- ============================================================
-- QUERIES
-- ============================================================
create table public.queries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body text not null,
  priority public.query_priority not null default 'normal',
  status public.query_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.queries enable row level security;
create index idx_queries_project on public.queries(project_id, created_at desc);
create trigger queries_updated_at before update on public.queries
  for each row execute function public.update_updated_at_column();

create table public.query_replies (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.queries(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.query_replies enable row level security;
create index idx_query_replies on public.query_replies(query_id, created_at);

-- ============================================================
-- SITE VISITS
-- ============================================================
create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_date date not null,
  requested_slot text,
  status public.visit_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_visits enable row level security;
create index idx_site_visits_project on public.site_visits(project_id, requested_date desc);
create trigger site_visits_updated_at before update on public.site_visits
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- READINESS CHECKLIST
-- ============================================================
create table public.readiness_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  status public.readiness_status not null default 'pending',
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.readiness_items enable row level security;
create index idx_readiness_project on public.readiness_items(project_id, sort_order);
create trigger readiness_updated_at before update on public.readiness_items
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- RATINGS + REFERRALS
-- ============================================================
create table public.project_ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  feedback text,
  created_at timestamptz not null default now()
);
alter table public.project_ratings enable row level security;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referee_name text not null,
  referee_contact text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text,
  link_to text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index idx_notifications_recipient on public.notifications(recipient_id, created_at desc);

-- ============================================================
-- RLS POLICIES (project-scoped read for members/admin)
-- ============================================================

-- Helper macro repeated: project member or admin can read; admins can write; engineers/clients write only their scope.

-- milestones
create policy "members read milestones" on public.milestones for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "engineers/admins write milestones" on public.milestones for all to authenticated
  using (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')))
  with check (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')));

-- progress_updates
create policy "members read progress" on public.progress_updates for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "engineers/admins write progress" on public.progress_updates for insert to authenticated
  with check (
    (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')))
    and author_id = auth.uid()
  );
create policy "authors delete own progress" on public.progress_updates for delete to authenticated
  using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- documents
create policy "members read documents" on public.documents for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "engineers/admins write documents" on public.documents for insert to authenticated
  with check (
    (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')))
    and uploader_id = auth.uid()
  );
create policy "uploaders delete own documents" on public.documents for delete to authenticated
  using (uploader_id = auth.uid() or public.is_admin(auth.uid()));

-- queries
create policy "members read queries" on public.queries for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "clients create queries" on public.queries for insert to authenticated
  with check (
    public.is_project_member(project_id, auth.uid()) and author_id = auth.uid()
  );
create policy "members update queries" on public.queries for update to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()))
  with check (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));

-- query_replies
create policy "members read replies" on public.query_replies for select to authenticated
  using (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.queries q
      where q.id = query_replies.query_id
        and public.is_project_member(q.project_id, auth.uid())
    )
  );
create policy "members write replies" on public.query_replies for insert to authenticated
  with check (
    author_id = auth.uid() and (
      public.is_admin(auth.uid()) or exists (
        select 1 from public.queries q
        where q.id = query_replies.query_id
          and public.is_project_member(q.project_id, auth.uid())
      )
    )
  );

-- site_visits
create policy "members read visits" on public.site_visits for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "members create visits" on public.site_visits for insert to authenticated
  with check (
    public.is_project_member(project_id, auth.uid()) and requested_by = auth.uid()
  );
create policy "engineers/admins update visits" on public.site_visits for update to authenticated
  using (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')))
  with check (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')));

-- readiness_items
create policy "members read readiness" on public.readiness_items for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "engineers/admins write readiness" on public.readiness_items for all to authenticated
  using (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')))
  with check (public.is_admin(auth.uid()) or (public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'engineer')));

-- project_ratings
create policy "members read ratings" on public.project_ratings for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_project_member(project_id, auth.uid()));
create policy "client submits rating" on public.project_ratings for insert to authenticated
  with check (
    client_id = auth.uid() and public.is_project_member(project_id, auth.uid()) and public.has_role(auth.uid(),'client')
  );

-- referrals
create policy "members read own referrals" on public.referrals for select to authenticated
  using (public.is_admin(auth.uid()) or referrer_id = auth.uid());
create policy "client submits referral" on public.referrals for insert to authenticated
  with check (
    referrer_id = auth.uid() and public.is_project_member(project_id, auth.uid())
  );

-- notifications
create policy "recipient reads notifications" on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy "recipient updates notifications" on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
create policy "system inserts notifications" on public.notifications for insert to authenticated
  with check (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('progress-photos', 'progress-photos', true),
  ('project-documents', 'project-documents', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- progress-photos: public read, engineer/admin write within project folder = project_id/...
create policy "anyone reads progress photos" on storage.objects for select
  using (bucket_id = 'progress-photos');
create policy "engineers/admins upload progress photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos' and (
      public.has_role(auth.uid(),'engineer') or public.has_role(auth.uid(),'admin')
    )
  );
create policy "engineers/admins delete progress photos" on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-photos' and (
      public.has_role(auth.uid(),'engineer') or public.has_role(auth.uid(),'admin')
    )
  );

-- project-documents: private; members read via signed URLs only; engineers/admins write
create policy "members read documents bucket" on storage.objects for select to authenticated
  using (
    bucket_id = 'project-documents' and (
      public.has_role(auth.uid(),'admin')
      or public.has_role(auth.uid(),'engineer')
      or public.has_role(auth.uid(),'client')
    )
  );
create policy "engineers/admins upload documents" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-documents' and (
      public.has_role(auth.uid(),'engineer') or public.has_role(auth.uid(),'admin')
    )
  );

-- avatars: public read, user writes own
create policy "anyone reads avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "users upload own avatar" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "users update own avatar" on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );