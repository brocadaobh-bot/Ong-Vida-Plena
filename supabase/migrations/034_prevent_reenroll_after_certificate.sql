-- ============================================================
-- Migration 034: Impede refazer curso após certificado emitido
-- ============================================================

CREATE OR REPLACE FUNCTION beneficiary_has_certificate_for_course(
  p_beneficiary_id UUID,
  p_course_id UUID
)
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
    JOIN classes cl ON cl.id = e.class_id
    WHERE e.beneficiary_id = p_beneficiary_id
      AND cl.course_id = p_course_id
  );
$$;

REVOKE ALL ON FUNCTION beneficiary_has_certificate_for_course(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION beneficiary_has_certificate_for_course(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION prevent_reenroll_after_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_id UUID;
BEGIN
  IF NEW.status IN ('cancelled', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT course_id INTO v_course_id
  FROM classes
  WHERE id = NEW.class_id;

  IF v_course_id IS NOT NULL
     AND beneficiary_has_certificate_for_course(NEW.beneficiary_id, v_course_id) THEN
    RAISE EXCEPTION 'beneficiary_already_certified_for_course'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollments_prevent_reenroll_after_certificate ON enrollments;

CREATE TRIGGER trg_enrollments_prevent_reenroll_after_certificate
  BEFORE INSERT OR UPDATE OF beneficiary_id, class_id, status ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reenroll_after_certificate();
