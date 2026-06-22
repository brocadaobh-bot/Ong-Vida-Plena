-- ============================================================
-- Migration 002: Tabelas Principais
-- profiles, addresses, beneficiary_profiles, staff_profiles
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Função auxiliar: atualiza updated_at automaticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- Tabela: addresses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postal_code VARCHAR(10),
  street      VARCHAR(255),
  number      VARCHAR(20),
  complement  VARCHAR(100),
  district    VARCHAR(100),
  city        VARCHAR(100) NOT NULL,
  state       CHAR(2)      NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: profiles
-- Sincroniza com auth.users. Criada automaticamente via trigger.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role    NOT NULL DEFAULT 'beneficiary',
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  document_type   document_type,
  document_number VARCHAR(20),
  birth_date      DATE,
  status          user_status  NOT NULL DEFAULT 'active',
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_email_unique UNIQUE (email)
);

CREATE INDEX idx_profiles_role   ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email  ON profiles(email);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Trigger: cria profile + beneficiary_profile ao criar usuário no Auth
-- SECURITY DEFINER + search_path evita falhas com RLS habilitado
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email     TEXT;
  v_full_name TEXT;
  v_role      user_role := 'beneficiary';
BEGIN
  v_email := COALESCE(
    NULLIF(TRIM(NEW.email), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'email'), '')
  );

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'handle_new_user: email obrigatório para criar profile (user_id=%)', NEW.id;
  END IF;

  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(v_email, '@', 1),
    'Usuário'
  );

  IF NEW.raw_user_meta_data->>'role' IN ('admin', 'assistant', 'instructor', 'beneficiary') THEN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, v_email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = EXCLUDED.full_name,
    updated_at = NOW();

  IF v_role = 'beneficiary' THEN
    INSERT INTO public.beneficiary_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Permissões exigidas pelo Supabase Auth
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Tabela: beneficiary_profiles
-- Dados complementares exclusivos de beneficiários
-- ─────────────────────────────────────────────────────────────
CREATE TABLE beneficiary_profiles (
  id                      UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              UUID             NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  social_name             VARCHAR(255),
  gender                  gender_type,
  address_id              UUID             REFERENCES addresses(id) ON DELETE SET NULL,
  education_level         education_level,
  employment_status       employment_status,
  family_income_range     VARCHAR(50),
  vulnerability_notes     TEXT,
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  created_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_beneficiary_profiles_profile_id ON beneficiary_profiles(profile_id);
CREATE INDEX idx_beneficiary_profiles_address_id ON beneficiary_profiles(address_id);

CREATE TRIGGER trg_beneficiary_profiles_updated_at
  BEFORE UPDATE ON beneficiary_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: staff_profiles
-- Dados complementares de admins, assistentes e instrutores
-- ─────────────────────────────────────────────────────────────
CREATE TABLE staff_profiles (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  department   VARCHAR(100),
  position     VARCHAR(100),
  bio          TEXT,
  active_since DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_profiles_profile_id ON staff_profiles(profile_id);

CREATE TRIGGER trg_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
