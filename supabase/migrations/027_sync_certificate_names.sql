-- ============================================================
-- Migration 027: Sincronizar nome nos certificados ao atualizar perfil
-- ============================================================

CREATE OR REPLACE FUNCTION sync_course_certificates_beneficiary_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    UPDATE course_certificates cc
    SET beneficiary_name = NEW.full_name
    FROM enrollments e
    WHERE e.id = cc.enrollment_id
      AND e.beneficiary_id = NEW.id
      AND e.status = 'completed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_certificate_names ON profiles;
CREATE TRIGGER trg_profiles_sync_certificate_names
  AFTER UPDATE OF full_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_certificates_beneficiary_name();

-- Garante certificados existentes alinhados ao nome atual do perfil
UPDATE course_certificates cc
SET beneficiary_name = p.full_name
FROM enrollments e
JOIN profiles p ON p.id = e.beneficiary_id
WHERE e.id = cc.enrollment_id
  AND e.status = 'completed'
  AND cc.beneficiary_name IS DISTINCT FROM p.full_name;
