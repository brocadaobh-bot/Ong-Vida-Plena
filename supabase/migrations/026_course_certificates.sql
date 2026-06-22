-- ============================================================
-- Migration 026: Certificados digitais de conclusão
-- ============================================================

CREATE TABLE course_certificates (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id    UUID         NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_code VARCHAR(32)  NOT NULL UNIQUE,
  beneficiary_name VARCHAR(255) NOT NULL,
  course_title     VARCHAR(255) NOT NULL,
  class_name       VARCHAR(255) NOT NULL,
  workload_hours   INTEGER,
  issued_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_certificates_enrollment ON course_certificates(enrollment_id);
CREATE INDEX idx_course_certificates_code ON course_certificates(certificate_code);
CREATE INDEX idx_course_certificates_issued_at ON course_certificates(issued_at DESC);

CREATE OR REPLACE FUNCTION generate_certificate_code(p_enrollment_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN 'VP-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    UPPER(SUBSTRING(REPLACE(p_enrollment_id::text, '-', ''), 1, 8));
END;
$$;

CREATE OR REPLACE FUNCTION issue_course_certificate_for_enrollment(p_enrollment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment enrollments%ROWTYPE;
  v_profile    profiles%ROWTYPE;
  v_class      classes%ROWTYPE;
  v_course     courses%ROWTYPE;
BEGIN
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND OR v_enrollment.status != 'completed' THEN
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_enrollment.beneficiary_id;
  SELECT * INTO v_class FROM classes WHERE id = v_enrollment.class_id;
  SELECT * INTO v_course FROM courses WHERE id = v_class.course_id;

  INSERT INTO course_certificates (
    enrollment_id,
    certificate_code,
    beneficiary_name,
    course_title,
    class_name,
    workload_hours,
    issued_at
  ) VALUES (
    v_enrollment.id,
    generate_certificate_code(v_enrollment.id),
    COALESCE(v_profile.full_name, 'Participante'),
    COALESCE(v_course.title, 'Curso'),
    COALESCE(v_class.name, 'Turma'),
    v_course.workload_hours,
    NOW()
  )
  ON CONFLICT (enrollment_id) DO UPDATE SET
    beneficiary_name = EXCLUDED.beneficiary_name,
    course_title     = EXCLUDED.course_title,
    class_name       = EXCLUDED.class_name,
    workload_hours   = EXCLUDED.workload_hours,
    issued_at        = EXCLUDED.issued_at;
END;
$$;

CREATE OR REPLACE FUNCTION trg_issue_certificate_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM issue_course_certificate_for_enrollment(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollments_issue_certificate ON enrollments;
CREATE TRIGGER trg_enrollments_issue_certificate
  AFTER UPDATE OF status ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trg_issue_certificate_on_completion();

-- Backfill para inscrições já concluídas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM enrollments WHERE status = 'completed'
  LOOP
    PERFORM issue_course_certificate_for_enrollment(r.id);
  END LOOP;
END;
$$;

ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_certificates.select.own"
  ON course_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = course_certificates.enrollment_id
        AND e.beneficiary_id = auth.uid()
    )
    OR is_admin_or_assistant()
  );

CREATE POLICY "course_certificates.select.instructor"
  ON course_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.id = course_certificates.enrollment_id
        AND c.instructor_id = auth.uid()
    )
  );

GRANT SELECT ON course_certificates TO authenticated;

REVOKE ALL ON FUNCTION issue_course_certificate_for_enrollment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION issue_course_certificate_for_enrollment(UUID) TO service_role;
