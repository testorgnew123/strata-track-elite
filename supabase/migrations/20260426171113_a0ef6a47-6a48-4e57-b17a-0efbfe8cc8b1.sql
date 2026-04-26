-- 1) Tighten notifications insert: only admin or self
drop policy if exists "system inserts notifications" on public.notifications;
create policy "admin or self insert notifications" on public.notifications for insert to authenticated
  with check (
    public.is_admin(auth.uid()) or recipient_id = auth.uid()
  );

-- 2) Lock down storage buckets: make them private and gate SELECT by role
update storage.buckets set public = false where id in ('progress-photos','avatars');

-- progress-photos: drop the open SELECT and replace with role-gated
drop policy if exists "anyone reads progress photos" on storage.objects;
create policy "members read progress photos" on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-photos' and (
      public.has_role(auth.uid(),'admin')
      or public.has_role(auth.uid(),'engineer')
      or public.has_role(auth.uid(),'client')
    )
  );

-- avatars: drop the open SELECT and replace with authenticated-only
drop policy if exists "anyone reads avatars" on storage.objects;
create policy "authenticated read avatars" on storage.objects for select to authenticated
  using (bucket_id = 'avatars');