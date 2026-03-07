-- ============================================================
-- FinFlow — Supabase Database Schema (v3 - Fix RLS Recursion)
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Enable UUID extension ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Table: profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: otomatis buat profil kosong saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Table: companies ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'USD',
  join_code   TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: company_members ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_members (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, company_id)
);

-- Trigger: saat company baru dibuat, otomatis masukkan owner sebagai admin
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (NEW.owner_id, NEW.id, 'admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_company();

-- ─── Table: transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SECURITY DEFINER FUNCTIONS (Memutus Rekursi RLS) ────────────────────────
-- Fungsi ini berjalan dengan hak superuser sehingga tidak memicu RLS lagi.

-- Kembalikan semua company_id yang diikuti user saat ini
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS TABLE(company_id UUID)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = auth.uid();
$$;

-- Kembalikan company_id di mana user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.get_my_admin_company_ids()
RETURNS TABLE(company_id UUID)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin';
$$;

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- Drop semua policy lama agar tidak konflik
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner has full access to their company" ON public.companies;
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Members can update company profile" ON public.companies;
DROP POLICY IF EXISTS "Members can view own memberships" ON public.company_members;
DROP POLICY IF EXISTS "Members can view all members of their company" ON public.company_members;
DROP POLICY IF EXISTS "Members can join a company" ON public.company_members;
DROP POLICY IF EXISTS "Members can leave a company" ON public.company_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.company_members;
DROP POLICY IF EXISTS "Company members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Company members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Company members can delete own transactions" ON public.transactions;

-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── companies ─────────────────────────────────────────────────────────────────
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Owner: akses penuh
CREATE POLICY "Owner has full access to their company"
  ON public.companies FOR ALL
  USING (auth.uid() = owner_id);

-- Member: bisa lihat perusahaan tempat dia terdaftar
CREATE POLICY "Members can view their company"
  ON public.companies FOR SELECT
  USING (id IN (SELECT company_id FROM public.get_my_company_ids()));

-- Member/Admin: bisa update nama & currency
CREATE POLICY "Members can update company profile"
  ON public.companies FOR UPDATE
  USING (id IN (SELECT company_id FROM public.get_my_company_ids()));

-- ── company_members ───────────────────────────────────────────────────────────
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Gunakan fungsi SECURITY DEFINER → tidak ada rekursi
CREATE POLICY "Members can view all members of their company"
  ON public.company_members FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.get_my_company_ids()));

-- Insert: hanya untuk diri sendiri (join company)
CREATE POLICY "Members can join a company"
  ON public.company_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete: hanya untuk diri sendiri (leave company)
CREATE POLICY "Members can leave a company"
  ON public.company_members FOR DELETE
  USING (auth.uid() = user_id);

-- Update role: hanya admin yang bisa mengubah role member lain
-- (gunakan fungsi SECURITY DEFINER → tidak ada rekursi)
CREATE POLICY "Admins can update member roles"
  ON public.company_members FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.get_my_admin_company_ids()));

-- ── transactions ──────────────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view transactions"
  ON public.transactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.get_my_company_ids()));

CREATE POLICY "Company members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.get_my_company_ids()));

CREATE POLICY "Company members can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Indexes (performance) ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_owner      ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_join_code  ON public.companies(join_code);
CREATE INDEX IF NOT EXISTS idx_members_user         ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_company      ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON public.transactions(date DESC);
