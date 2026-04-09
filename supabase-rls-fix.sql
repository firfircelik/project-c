-- RLS Policy düzeltmesi
drop policy if exists "tenants_select" on public.tenants;
drop policy if exists "tenants_insert" on public.tenants;
drop policy if exists "tenants_update" on public.tenants;
drop policy if exists "tenants_delete" on public.tenants;

create policy "tenants_all" on public.tenants for all using (true) with check (true);
