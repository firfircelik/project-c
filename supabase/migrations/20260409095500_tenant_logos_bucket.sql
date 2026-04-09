insert into storage.buckets (id, name, public)
values ('tenant-logos', 'tenant-logos', true)
on conflict (id) do nothing;

drop policy if exists "public_read_tenant_logos" on storage.objects;
create policy "public_read_tenant_logos" on storage.objects for select using (
  bucket_id = 'tenant-logos'
);

drop policy if exists "tenant_upload_logos" on storage.objects;
create policy "tenant_upload_logos" on storage.objects for insert with check (
  bucket_id = 'tenant-logos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.users where id = auth.uid())
);

drop policy if exists "tenant_update_logos" on storage.objects;
create policy "tenant_update_logos" on storage.objects for update using (
  bucket_id = 'tenant-logos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.users where id = auth.uid())
);
