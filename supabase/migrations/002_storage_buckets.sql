-- Storage buckets

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('dish-photos', 'dish-photos', true),
  ('menu-scans', 'menu-scans', false),
  ('qr-codes', 'qr-codes', true);

-- logos: public read, owner write
create policy "public read logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "authenticated upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );

create policy "owner update logos"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "owner delete logos"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

-- dish-photos: public read, owner write
create policy "public read dish photos"
  on storage.objects for select
  using (bucket_id = 'dish-photos');

create policy "authenticated upload dish photos"
  on storage.objects for insert
  with check (
    bucket_id = 'dish-photos'
    and auth.role() = 'authenticated'
  );

create policy "owner update dish photos"
  on storage.objects for update
  using (bucket_id = 'dish-photos' and auth.role() = 'authenticated');

create policy "owner delete dish photos"
  on storage.objects for delete
  using (bucket_id = 'dish-photos' and auth.role() = 'authenticated');

-- menu-scans: owner only
create policy "owner read menu scans"
  on storage.objects for select
  using (bucket_id = 'menu-scans' and auth.role() = 'authenticated');

create policy "owner upload menu scans"
  on storage.objects for insert
  with check (bucket_id = 'menu-scans' and auth.role() = 'authenticated');

create policy "owner delete menu scans"
  on storage.objects for delete
  using (bucket_id = 'menu-scans' and auth.role() = 'authenticated');

-- qr-codes: public read, owner write
create policy "public read qr codes"
  on storage.objects for select
  using (bucket_id = 'qr-codes');

create policy "authenticated upload qr codes"
  on storage.objects for insert
  with check (
    bucket_id = 'qr-codes'
    and auth.role() = 'authenticated'
  );

create policy "owner update qr codes"
  on storage.objects for update
  using (bucket_id = 'qr-codes' and auth.role() = 'authenticated');

create policy "owner delete qr codes"
  on storage.objects for delete
  using (bucket_id = 'qr-codes' and auth.role() = 'authenticated');
