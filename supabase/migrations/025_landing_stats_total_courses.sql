-- ============================================================
-- Migration 025: Cursos na landing = total cadastrado (não depende de turmas/vagas)
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_landing_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_enrollments INTEGER;
  v_registered_only INTEGER;
  v_users_served INTEGER;
  v_courses INTEGER;
  v_satisfaction_rate INTEGER;
  v_satisfaction_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_enrollments
  FROM enrollments
  WHERE status NOT IN ('cancelled', 'rejected');

  SELECT COUNT(*)::INTEGER
  INTO v_registered_only
  FROM profiles p
  WHERE p.role = 'beneficiary'
    AND p.status != 'blocked'
    AND NOT EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.beneficiary_id = p.id
        AND e.status NOT IN ('cancelled', 'rejected')
    );

  v_users_served := v_enrollments + v_registered_only;

  -- Total de cursos criados na plataforma (independente de turmas, vagas ou status da turma)
  SELECT COUNT(*)::INTEGER
  INTO v_courses
  FROM courses;

  SELECT
    COUNT(*)::INTEGER,
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(AVG(score) / 5.0 * 100)::INTEGER
    END
  INTO v_satisfaction_count, v_satisfaction_rate
  FROM platform_ratings;

  RETURN jsonb_build_object(
    'users_served', v_users_served,
    'courses_available', v_courses,
    'satisfaction_rate', v_satisfaction_rate,
    'satisfaction_count', v_satisfaction_count,
    'social_impact_years', 12
  );
END;
$$;

REVOKE ALL ON FUNCTION get_public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_landing_stats() TO anon, authenticated;
