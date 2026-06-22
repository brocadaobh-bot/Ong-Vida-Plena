-- ============================================================
-- Migration 010: Correção de Auth + Profiles (sem reset total)
-- Execute se signup falhar com HTTP 500 mas tabelas já existem.
-- ============================================================

-- Garante extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recria trigger de profile (idempotente)
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
    RAISE EXCEPTION 'handle_new_user: email obrigatório (user_id=%)', NEW.id;
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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: usuários auth sem profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@recuperado.local'),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), 'Usuário'),
  COALESCE(
    CASE
      WHEN u.raw_user_meta_data->>'role' IN ('admin','assistant','instructor','beneficiary')
      THEN (u.raw_user_meta_data->>'role')::user_role
      ELSE NULL
    END,
    'beneficiary'::user_role
  )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Backfill: beneficiários sem beneficiary_profile
INSERT INTO public.beneficiary_profiles (profile_id)
SELECT p.id
FROM public.profiles p
WHERE p.role = 'beneficiary'
  AND NOT EXISTS (
    SELECT 1 FROM public.beneficiary_profiles bp WHERE bp.profile_id = p.id
  )
ON CONFLICT (profile_id) DO NOTHING;

-- Corrige funções RLS helpers (search_path seguro)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'); $$;

CREATE OR REPLACE FUNCTION is_admin_or_assistant()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'assistant')); $$;

CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'); $$;
