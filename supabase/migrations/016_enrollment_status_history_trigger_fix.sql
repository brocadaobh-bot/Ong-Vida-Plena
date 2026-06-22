-- ============================================================
-- Migration 016: Corrige histórico ao alterar status de inscrição
-- O trigger inseria em participant_status_history sem política INSERT,
-- fazendo o UPDATE em enrollments falhar silenciosamente (RLS).
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_enrollment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO participant_status_history (enrollment_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_enrollment_status_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_enrollment_status_change() TO postgres;
GRANT EXECUTE ON FUNCTION public.log_enrollment_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_enrollment_status_change() TO authenticated;
