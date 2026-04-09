alter table public.tenants enable row level security;
drop policy if exists tenants_select on public.tenants;
create policy "tenants_select" on public.tenants for select using (
  id in (select tenant_id from public.users where id = auth.uid())
);

alter table public.match_scores enable row level security;
drop policy if exists match_scores_tenant_isolation on public.match_scores;
create policy "match_scores_tenant_isolation" on public.match_scores for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);
