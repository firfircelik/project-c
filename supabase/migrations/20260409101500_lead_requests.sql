create table if not exists public.lead_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  company text,
  team_size text,
  message text,
  created_at timestamptz default now()
);
