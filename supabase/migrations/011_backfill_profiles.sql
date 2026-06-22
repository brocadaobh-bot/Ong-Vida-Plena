-- ============================================================
-- Migration 011: Backfill imediato — usuários auth sem profile
-- Execute se cadastrou e viu "perfil não foi gerado"
-- Cole no SQL Editor → Run
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@recuperado.local'),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'Usuário'),
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

INSERT INTO public.beneficiary_profiles (profile_id)
SELECT p.id
FROM public.profiles p
WHERE p.role = 'beneficiary'
  AND NOT EXISTS (
    SELECT 1 FROM public.beneficiary_profiles bp WHERE bp.profile_id = p.id
  )
ON CONFLICT (profile_id) DO NOTHING;

-- Confere resultado
SELECT u.email, p.full_name, p.role,
       CASE WHEN bp.profile_id IS NOT NULL THEN 'sim' ELSE 'não' END AS tem_beneficiary
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.beneficiary_profiles bp ON bp.profile_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;
