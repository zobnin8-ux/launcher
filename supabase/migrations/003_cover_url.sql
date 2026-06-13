alter table restaurants add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "public read covers"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "authenticated upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.role() = 'authenticated'
  );

create policy "owner update covers"
  on storage.objects for update
  using (bucket_id = 'covers' and auth.role() = 'authenticated');

create policy "owner delete covers"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.role() = 'authenticated');
