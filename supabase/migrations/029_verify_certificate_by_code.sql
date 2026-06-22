-- ============================================================
-- Migration 029: Verificação pública de certificados por código
-- ============================================================

CREATE OR REPLACE FUNCTION verify_certificate_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_row  course_certificates%ROWTYPE;
BEGIN
  v_code := UPPER(TRIM(p_code));

  IF v_code IS NULL OR LENGTH(v_code) < 6 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_code');
  END IF;

  SELECT cc.*
  INTO v_row
  FROM course_certificates cc
  JOIN enrollments e ON e.id = cc.enrollment_id
  WHERE cc.certificate_code = v_code
    AND e.status = 'completed';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'valid',            true,
    'certificate_code', v_row.certificate_code,
    'beneficiary_name', v_row.beneficiary_name,
    'course_title',     v_row.course_title,
    'class_name',       v_row.class_name,
    'workload_hours',   v_row.workload_hours,
    'issued_at',        v_row.issued_at
  );
END;
$$;

REVOKE ALL ON FUNCTION verify_certificate_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_certificate_by_code(TEXT) TO anon, authenticated, service_role;
