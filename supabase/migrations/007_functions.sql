-- ============================================================
-- Migration 007: Funções de Negócio e RPC
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Funções auxiliares de autorização (usadas nas políticas RLS)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin_or_assistant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'assistant')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Verifica se uma turma ainda tem vagas disponíveis
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION class_has_capacity(p_class_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INTEGER;
  v_confirmed_count INTEGER;
BEGIN
  SELECT capacity INTO v_capacity FROM classes WHERE id = p_class_id;
  IF v_capacity IS NULL THEN RETURN FALSE; END IF;

  SELECT COUNT(*) INTO v_confirmed_count
  FROM enrollments
  WHERE class_id = p_class_id AND status IN ('confirmed');

  RETURN v_confirmed_count < v_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Retorna a política de privacidade ativa
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_active_privacy_policy()
RETURNS TABLE(
  id           UUID,
  version      VARCHAR,
  title        VARCHAR,
  content      TEXT,
  published_at TIMESTAMPTZ
) AS $$
  SELECT id, version, title, content, published_at
  FROM privacy_policies
  WHERE is_active = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Verifica se um usuário aceitou a política ativa
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION user_has_accepted_current_policy(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  SELECT id INTO v_policy_id FROM privacy_policies WHERE is_active = TRUE;
  IF v_policy_id IS NULL THEN RETURN TRUE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM consents
    WHERE profile_id         = p_user_id
      AND privacy_policy_id  = v_policy_id
      AND consent_type       = 'privacy_policy'
      AND granted            = TRUE
      AND revoked_at         IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Registra entrada no log de auditoria (chamada via server-side)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_audit_action(
  p_actor_id    UUID,
  p_action      VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id   UUID,
  p_old_values  JSONB    DEFAULT NULL,
  p_new_values  JSONB    DEFAULT NULL,
  p_ip_address  INET     DEFAULT NULL,
  p_user_agent  TEXT     DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_id, action, entity_type, entity_id,
    old_values, new_values, ip_address, user_agent
  )
  VALUES (
    p_actor_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Estatísticas de inscrição de uma turma
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_class_enrollment_stats(p_class_id UUID)
RETURNS TABLE(
  total_active  BIGINT,
  confirmed     BIGINT,
  pending       BIGINT,
  waitlisted    BIGINT,
  cancelled     BIGINT,
  completed     BIGINT,
  capacity      INTEGER,
  available     INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE e.status NOT IN ('cancelled','rejected','dropped'))     AS total_active,
    COUNT(*) FILTER (WHERE e.status = 'confirmed')                                 AS confirmed,
    COUNT(*) FILTER (WHERE e.status = 'pending')                                   AS pending,
    COUNT(*) FILTER (WHERE e.status = 'waitlisted')                                AS waitlisted,
    COUNT(*) FILTER (WHERE e.status IN ('cancelled','rejected','dropped'))         AS cancelled,
    COUNT(*) FILTER (WHERE e.status = 'completed')                                 AS completed,
    c.capacity,
    GREATEST(
      0,
      c.capacity - (COUNT(*) FILTER (WHERE e.status = 'confirmed'))::INTEGER
    )::INTEGER AS available
  FROM classes c
  LEFT JOIN enrollments e ON e.class_id = c.id
  WHERE c.id = p_class_id
  GROUP BY c.capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Gera dados do beneficiário para portabilidade (exportação)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_beneficiary_export(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id',            p.id,
        'full_name',     p.full_name,
        'email',         p.email,
        'phone',         p.phone,
        'birth_date',    p.birth_date,
        'created_at',    p.created_at
      )
      FROM profiles p WHERE p.id = p_profile_id
    ),
    'beneficiary_data', (
      SELECT jsonb_build_object(
        'social_name',             bp.social_name,
        'gender',                  bp.gender,
        'education_level',         bp.education_level,
        'employment_status',       bp.employment_status,
        'emergency_contact_name',  bp.emergency_contact_name
      )
      FROM beneficiary_profiles bp WHERE bp.profile_id = p_profile_id
    ),
    'enrollments', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'class_name',     cl.name,
        'course_title',   co.title,
        'status',         e.status,
        'enrolled_at',    e.enrolled_at
      )), '[]'::jsonb)
      FROM enrollments e
      JOIN classes cl  ON cl.id = e.class_id
      JOIN courses co  ON co.id = cl.course_id
      WHERE e.beneficiary_id = p_profile_id
    ),
    'consents', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'type',       c.consent_type,
        'granted',    c.granted,
        'granted_at', c.granted_at,
        'revoked_at', c.revoked_at
      )), '[]'::jsonb)
      FROM consents c WHERE c.profile_id = p_profile_id
    ),
    'exported_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Métricas do dashboard administrativo
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_beneficiaries',   (SELECT COUNT(*) FROM profiles WHERE role = 'beneficiary' AND status = 'active'),
    'total_courses',         (SELECT COUNT(*) FROM courses WHERE status = 'active'),
    'total_classes',         (SELECT COUNT(*) FROM classes WHERE status IN ('open','in_progress')),
    'total_enrollments',     (SELECT COUNT(*) FROM enrollments WHERE status IN ('confirmed','pending')),
    'pending_lgpd_requests', (SELECT COUNT(*) FROM data_subject_requests WHERE status IN ('open','in_review')),
    'new_beneficiaries_30d', (
      SELECT COUNT(*) FROM profiles
      WHERE role = 'beneficiary' AND created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO v_metrics;

  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
