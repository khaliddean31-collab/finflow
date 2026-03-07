-- ============================================================
-- FinFlow — Supabase Database Schema (v2)
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Table: profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trigger: otomatis buat profil kosong saat user baru register
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Table: companies ─────────────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  currency    text not null default 'USD',
  join_code   text not null unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Table: company_members ───────────────────────────────────────────────────
-- Mencatat SEMUA anggota perusahaan termasuk owner (role='admin').
-- Owner pertama kali buat perusahaan otomatis masuk ke sini sebagai admin.
create table if not exists public.company_members (
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'admin')),
  joined_at   timestamptz default now(),
  primary key (user_id, company_id)
);

-- Trigger: saat company baru dibuat, otomatis masukkan owner sebagai admin
create or replace function public.handle_new_company()
returns trigger language plpgsql security definer as $$
begin
  insert into public.company_members (user_id, company_id, role)
  values (new.owner_id, new.id, 'admin')
  on conflict (user_id, company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_company_created on public.companies;
create trigger on_company_created
  after insert on public.companies
  for each row execute procedure public.handle_new_company();

-- ─── Table: transactions ──────────────────────────────────────────────────────
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete set null,
  title       text not null,
  amount      numeric(15, 2) not null check (amount > 0),
  category    text not null,
  type        text not null check (type in ('income', 'expense')),
  date        date not null,
  note        text,
  created_at  timestamptz default now()
);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- companies: owner bisa CRUD; member bisa SELECT dan UPDATE (edit nama/currency)
alter table public.companies enable row level security;

create policy "Owner has full access to their company"
  on public.companies for all
  using (auth.uid() = owner_id);

create policy "Members can view their company"
  on public.companies for select
  using (
    id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

-- Anggota (member ATAU admin) bisa update profil perusahaan
create policy "Members can update company profile"
  on public.companies for update
  using (
    id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

-- company_members: semua anggota bisa lihat daftar anggota perusahaan yang sama
alter table public.company_members enable row level security;

create policy "Members can view all members of their company"
  on public.company_members for select
  using (
    company_id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

create policy "Members can join a company"
  on public.company_members for insert
  with check (auth.uid() = user_id);

create policy "Members can leave a company"
  on public.company_members for delete
  using (auth.uid() = user_id);

-- Role update: hanya admin yang bisa ubah role member lain
-- Note: enforce ini di aplikasi + RLS berikut
create policy "Admins can update member roles"
  on public.company_members for update
  using (
    company_id in (
      select company_id from public.company_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- transactions: owner atau member company bisa akses
alter table public.transactions enable row level security;

create policy "Company members can view transactions"
  on public.transactions for select
  using (
    company_id in (
      select id from public.companies where owner_id = auth.uid()
      union
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

create policy "Company members can insert transactions"
  on public.transactions for insert
  with check (
    company_id in (
      select id from public.companies where owner_id = auth.uid()
      union
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

create policy "Company members can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ─── Indexes (performance) ────────────────────────────────────────────────────
create index if not exists idx_companies_owner     on public.companies(owner_id);
create index if not exists idx_companies_join_code on public.companies(join_code);
create index if not exists idx_members_user        on public.company_members(user_id);
create index if not exists idx_members_company     on public.company_members(company_id);
create index if not exists idx_transactions_company on public.transactions(company_id);
create index if not exists idx_transactions_date    on public.transactions(date desc);
