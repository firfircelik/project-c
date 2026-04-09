-- ============================================
-- EMLAK CRM PRO - Multi-Tenant Database Schema
-- Supabase SQL Editor'de çalıştır
-- ============================================

-- 1. TENANTS (Her emlakçı/firma için)
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  logo_url text,
  settings jsonb default '{"theme": "light", "currency": "TRY", "portal_integrations": {"sahibinden": false, "hepsiemlak": false, "zingat": false, "emlakjet": false}, "feed_token": null}'::jsonb,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. BRANCHES (Şubeler - opsiyonel)
create table public.branches (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  city text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. USERS (Kullanıcılar - tenant'a bağlı)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  role text default 'agent' check (role in ('agent', 'senior_agent', 'branch_manager', 'admin', 'owner')),
  branch_id uuid references public.branches(id),
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

-- 4. LISTINGS (İlanlar)
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  code text not null,
  title text not null,
  description text,
  type text check (type in ('satılık', 'kiralık')) not null,
  category text,
  price decimal(12,2),
  currency text default '₺',
  location jsonb default '{}'::jsonb,
  features jsonb default '{}'::jsonb,
  media jsonb default '[]'::jsonb,
  status text default 'taslak' check (status in ('taslak', 'onay_bekliyor', 'aktif', 'satıldı')),
  agent_id uuid references public.users(id),
  branch_id uuid references public.branches(id),
  ai_score int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

-- 5. CUSTOMERS (Müşteriler)
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  type text check (type in ('alıcı', 'satıcı', 'kiracı')),
  temperature text default 'cold' check (temperature in ('hot', 'warm', 'cold')),
  budget_min decimal(12,2),
  budget_max decimal(12,2),
  preferences jsonb default '{}'::jsonb,
  notes text,
  assigned_agent_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. INTERACTIONS (Etkileşimler)
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  type text check (type in ('telefon', 'whatsapp', 'email', 'gösterim')) not null,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- 7. TASKS (Görevler)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  type text check (type in ('iletişim', 'gösterim', 'pazarlık', 'sözleşme')),
  stage text default 'new' check (stage in ('new', 'contact', 'showing', 'negotiation', 'closed')),
  customer_id uuid references public.customers(id),
  listing_id uuid references public.listings(id),
  assigned_to uuid references public.users(id),
  due_date timestamptz,
  location text,
  event_start timestamptz,
  event_end timestamptz,
  comments_count int default 0,
  attachments_count int default 0,
  created_at timestamptz default now()
);

-- 8. CONTRACTS (Sözleşmeler)
create table public.contracts (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  customer_id uuid references public.customers(id),
  client_name text,
  type text check (type in ('satış', 'kiralama', 'yetki')),
  status text default 'taslak' check (status in ('taslak', 'imza_bekliyor', 'imzalandı')),
  amount decimal(12,2),
  currency text default '₺',
  contract_date date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- 9. PORTAL PUBLISH JOBS (Portal Yayın Kuyruğu)
create table public.portal_publish_jobs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  portal text check (portal in ('sahibinden', 'hepsiemlak', 'zingat', 'emlakjet')),
  status text default 'queued' check (status in ('queued', 'sent', 'failed')),
  message text,
  created_at timestamptz default now()
);

-- 10. MATCH SCORES (AI Eşleştirme Cache)
create table public.match_scores (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  score int not null,
  reasons text[] default '{}',
  updated_at timestamptz default now(),
  unique (tenant_id, listing_id, customer_id)
);

-- 11. LEAD REQUESTS (Demo Talepleri)
create table public.lead_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  company text,
  team_size text,
  message text,
  created_at timestamptz default now()
);

-- 10. PORTAL CREDENTIALS (Portal API/Feed Bilgileri)
create table public.portal_credentials (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  portal text check (portal in ('sahibinden', 'hepsiemlak', 'zingat', 'emlakjet')) not null,
  integration_type text default 'api' check (integration_type in ('api', 'feed', 'ftp')),
  api_key text,
  api_secret text,
  endpoint_url text,
  headers jsonb,
  username text,
  password text,
  feed_url text,
  is_active boolean default false,
  status text default 'configured' check (status in ('configured', 'verified', 'disabled')),
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, portal)
);

-- 8. TASK COMMENTS
create table public.tasks_comments (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.users(id),
  message text not null,
  created_at timestamptz default now()
);

-- 9. TASK ATTACHMENTS
create table public.tasks_attachments (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text,
  url text not null,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Çok Önemli!
-- ============================================

-- Tenants table
alter table public.tenants enable row level security;
drop policy if exists tenants_select on public.tenants;
create policy "tenants_select" on public.tenants for select using (
  id in (select tenant_id from public.users where id = auth.uid())
);

-- Branches
alter table public.branches enable row level security;
create policy "branches_tenant_isolation" on public.branches for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Users
alter table public.users enable row level security;
create policy "users_tenant_isolation" on public.users for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Listings
alter table public.listings enable row level security;
create policy "listings_tenant_isolation" on public.listings for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Customers
alter table public.customers enable row level security;
create policy "customers_tenant_isolation" on public.customers for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Interactions
alter table public.interactions enable row level security;
create policy "interactions_tenant_isolation" on public.interactions for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Tasks
alter table public.tasks enable row level security;
create policy "tasks_tenant_isolation" on public.tasks for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Tasks comments
alter table public.tasks_comments enable row level security;
create policy "tasks_comments_tenant_isolation" on public.tasks_comments for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Tasks attachments
alter table public.tasks_attachments enable row level security;
create policy "tasks_attachments_tenant_isolation" on public.tasks_attachments for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Contracts
alter table public.contracts enable row level security;
create policy "contracts_tenant_isolation" on public.contracts for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Portal publish jobs
alter table public.portal_publish_jobs enable row level security;
create policy "portal_publish_jobs_tenant_isolation" on public.portal_publish_jobs for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Portal credentials
alter table public.portal_credentials enable row level security;
create policy "portal_credentials_tenant_isolation" on public.portal_credentials for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- Match scores
alter table public.match_scores enable row level security;
create policy "match_scores_tenant_isolation" on public.match_scores for all using (
  tenant_id in (select tenant_id from public.users where id = auth.uid())
);

-- ============================================
-- INDEXES (Performans için)
-- ============================================

create index idx_listings_tenant on public.listings(tenant_id);
create index idx_listings_agent on public.listings(agent_id);
create index idx_customers_tenant on public.customers(tenant_id);
create index idx_customers_agent on public.customers(assigned_agent_id);
create index idx_tasks_tenant on public.tasks(tenant_id);
create index idx_tasks_stage on public.tasks(stage);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_interactions_customer on public.interactions(customer_id);
create index idx_tasks_comments_task on public.tasks_comments(task_id);
create index idx_tasks_attachments_task on public.tasks_attachments(task_id);
create index idx_contracts_tenant on public.contracts(tenant_id);
create index idx_contracts_customer on public.contracts(customer_id);
create index idx_portal_jobs_listing on public.portal_publish_jobs(listing_id);
create index idx_portal_credentials_tenant on public.portal_credentials(tenant_id);
