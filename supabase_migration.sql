-- ============================================================
-- FinFlow — Supabase Database Schema
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Table: profiles ──────────────────────────────────────────────────────────
-- Satu baris per user. Otomatis terhubung ke auth.users via id.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- WAJIB: Tambahkan kolom email jika tabel profiles sudah terlanjur dibuat sebelumnya
alter table public.profiles add column if not exists email text;

-- Trigger: otomatis buat profil kosong saat user baru register
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Table: companies ─────────────────────────────────────────────────────────
-- Setiap user bisa memiliki (atau bergabung ke) sebuah company.
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
-- Mencatat user yang bergabung ke company (bukan owner).
create table if not exists public.company_members (
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'admin')),
  joined_at   timestamptz default now(),
  primary key (user_id, company_id)
);

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

-- ─── TRIGER: Otomatis Tambahkan Owner sebagai Admin ──────────────────────────
create or replace function public.handle_new_company()
returns trigger language plpgsql security definer as $$
begin
  insert into public.company_members (user_id, company_id, role)
  values (new.owner_id, new.id, 'admin');
  return new;
end;
$$;

drop trigger if exists on_company_created on public.companies;
create trigger on_company_created
  after insert on public.companies
  for each row execute procedure public.handle_new_company();

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- 1. BERSIHKAN SEMUA KEBIJAKAN (POLICIES) LAMA AGAR TIDAK BENTROK
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'companies', 'company_members', 'transactions')
    ) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- 2. AKTIFKAN RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.transactions enable row level security;

-- 3. BUAT KEBIJAKAN BARU YANG BERSIH & BEBAS REKURSI

-- Profiles: Siapa saja bisa lihat (untuk daftar tim), tapi hanya bisa disunting diri sendiri
create policy "Profiles: Allow read all" on public.profiles for select using (true);
create policy "Profiles: Allow update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles: Allow insert own" on public.profiles for insert with check (auth.uid() = id);

-- Companies: Owner punya kuasa penuh, namun siapa pun yang login bisa mencari company via Join Code
create policy "Companies: Owner all access" on public.companies for all using (auth.uid() = owner_id);
create policy "Companies: Allow lookup" on public.companies for select to authenticated using (true);

-- Company Members: Semua orang bisa gabung dan ngintip siapa rekan setimnya (tanpa perlu loop query yg bikin recursion)
create policy "Members: Allow join" on public.company_members for insert with check (auth.uid() = user_id);
create policy "Members: Allow see teams" on public.company_members for select to authenticated using (true);
create policy "Members: Allow leave" on public.company_members for delete using (auth.uid() = user_id);

-- Transactions: Filter berdasarkan kepemilikan owner atau membership
create policy "Transactions: Select" on public.transactions for select using (
  company_id in (select id from public.companies where owner_id = auth.uid()) OR
  company_id in (select company_id from public.company_members where user_id = auth.uid())
);
create policy "Transactions: Insert" on public.transactions for insert with check (
  company_id in (select id from public.companies where owner_id = auth.uid()) OR
  company_id in (select company_id from public.company_members where user_id = auth.uid())
);
create policy "Transactions: Delete" on public.transactions for delete using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_companies_owner on public.companies(owner_id);
create index if not exists idx_companies_join_code on public.companies(join_code);
create index if not exists idx_members_user on public.company_members(user_id);
create index if not exists idx_members_company on public.company_members(company_id);
create index if not exists idx_transactions_company on public.transactions(company_id);
create index if not exists idx_transactions_date on public.transactions(date desc);
