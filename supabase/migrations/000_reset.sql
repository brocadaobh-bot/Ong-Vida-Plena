-- ============================================================
-- Migration 000: RESET COMPLETO DO BANCO (DEV)
-- ⚠️  APAGA TODOS OS DADOS DO SCHEMA public
-- Execute SOMENTE quando o banco estiver inconsistente.
-- Depois execute 001 → 009 na ordem.
-- ============================================================

-- Remove trigger de auth (não é apagado pelo CASCADE do public)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Remove todas as policies RLS do schema public
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Remove funções de negócio / RLS helpers
DROP FUNCTION IF EXISTS get_admin_dashboard_metrics() CASCADE;
DROP FUNCTION IF EXISTS generate_beneficiary_export(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_class_enrollment_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS log_audit_action(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_accepted_current_policy(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_active_privacy_policy() CASCADE;
DROP FUNCTION IF EXISTS class_has_capacity(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_instructor() CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_assistant() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove tabelas (ordem respeita FKs)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS data_exports CASCADE;
DROP TABLE IF EXISTS data_subject_requests CASCADE;
DROP TABLE IF EXISTS consents CASCADE;
DROP TABLE IF EXISTS privacy_policies CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS participant_status_history CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS beneficiary_profiles CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;

-- Remove enums
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS employment_status CASCADE;
DROP TYPE IF EXISTS education_level CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS data_export_format CASCADE;
DROP TYPE IF EXISTS data_request_status CASCADE;
DROP TYPE IF EXISTS data_request_type CASCADE;
DROP TYPE IF EXISTS consent_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS class_status CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS course_category CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
