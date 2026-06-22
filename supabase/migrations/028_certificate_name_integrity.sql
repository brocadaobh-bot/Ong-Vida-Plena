-- ============================================================
-- Migration 028: Nome do certificado imutável (correção só pela equipe)
-- Remove sincronização automática ao editar o próprio perfil.
-- ============================================================

DROP TRIGGER IF EXISTS trg_profiles_sync_certificate_names ON profiles;
DROP FUNCTION IF EXISTS sync_course_certificates_beneficiary_name();

ALTER TABLE course_certificates
  ADD COLUMN IF NOT EXISTS name_corrected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS name_corrected_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION beneficiary_has_certificates(p_beneficiary_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM course_certificates cc
    JOIN enrollments e ON e.id = cc.enrollment_id
    WHERE e.beneficiary_id = p_beneficiary_id
  );
$$;

REVOKE ALL ON FUNCTION beneficiary_has_certificates(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION beneficiary_has_certificates(UUID) TO authenticated, service_role;

-- Atualização de nome + certificados apenas pela equipe (admin/assistente via service role)
CREATE OR REPLACE FUNCTION staff_update_beneficiary_name_with_certificates(
  p_beneficiary_id UUID,
  p_new_name TEXT,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(TRIM(p_new_name), '') IS NULL THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;

  UPDATE profiles
  SET full_name = TRIM(p_new_name),
      updated_at = NOW()
  WHERE id = p_beneficiary_id;

  UPDATE course_certificates cc
  SET
    beneficiary_name = TRIM(p_new_name),
    name_corrected_at = NOW(),
    name_corrected_by = p_actor_id
  FROM enrollments e
  WHERE e.id = cc.enrollment_id
    AND e.beneficiary_id = p_beneficiary_id
    AND e.status = 'completed'
    AND cc.beneficiary_name IS DISTINCT FROM TRIM(p_new_name);
END;
$$;

REVOKE ALL ON FUNCTION staff_update_beneficiary_name_with_certificates(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION staff_update_beneficiary_name_with_certificates(UUID, TEXT, UUID) TO service_role;
