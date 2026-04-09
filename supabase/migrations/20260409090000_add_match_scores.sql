create table if not exists public.match_scores (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  score int not null,
  reasons text[] default '{}',
  updated_at timestamptz default now(),
  unique (tenant_id, listing_id, customer_id)
);
