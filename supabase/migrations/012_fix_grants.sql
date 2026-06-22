-- ============================================================
-- Migration 012: Permissões do schema public + RPC de profile
-- Corrige: "permission denied for schema public"
-- Execute no SQL Editor → Run
-- ============================================================

-- 1) Permissões no schema public (Supabase exige isso após resets)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- 2) RPC segura para criar profile (SECURITY DEFINER — bypassa RLS)
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_user_id   UUID,
  p_email     TEXT,
  p_full_name TEXT,
  p_role      user_role DEFAULT 'beneficiary'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (p_user_id, p_email, p_full_name, p_role)
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = EXCLUDED.full_name,
    updated_at = NOW();

  IF p_role = 'beneficiary' THEN
    INSERT INTO public.beneficiary_profiles (profile_id)
    VALUES (p_user_id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile(UUID, TEXT, TEXT, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(UUID, TEXT, TEXT, user_role) TO service_role;

-- 3) Reforça trigger de signup
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

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Backfill usuários órfãos
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@recuperado.local'),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), 'Usuário'),
  'beneficiary'::user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.beneficiary_profiles (profile_id)
SELECT p.id FROM public.profiles p
WHERE p.role = 'beneficiary'
  AND NOT EXISTS (SELECT 1 FROM public.beneficiary_profiles bp WHERE bp.profile_id = p.id)
ON CONFLICT (profile_id) DO NOTHING;
