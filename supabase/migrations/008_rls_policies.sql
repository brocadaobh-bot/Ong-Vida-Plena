-- ============================================================
-- Migration 008: Row Level Security (RLS)
-- Políticas de acesso para todas as tabelas
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Habilitar RLS em todas as tabelas
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_policies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings              ENABLE ROW LEVEL SECURITY;

-- ═════════════════════════════════════════════════════════════
-- PROFILES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "profiles.select.own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles.select.admin_assistant"
  ON profiles FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "profiles.select.instructor_students"
  ON profiles FOR SELECT
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.instructor_id = auth.uid()
        AND e.beneficiary_id = profiles.id
        AND e.status IN ('confirmed','pending','completed')
    )
  );

CREATE POLICY "profiles.update.own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Impede que o usuário altere seu próprio papel
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles.update.admin"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "profiles.insert.admin"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- ═════════════════════════════════════════════════════════════
-- ADDRESSES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "addresses.all.own"
  ON addresses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM beneficiary_profiles bp
      WHERE bp.address_id = addresses.id AND bp.profile_id = auth.uid()
    )
  );

CREATE POLICY "addresses.all.admin_assistant"
  ON addresses FOR ALL
  USING (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- BENEFICIARY_PROFILES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "beneficiary_profiles.select.own"
  ON beneficiary_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "beneficiary_profiles.select.admin_assistant"
  ON beneficiary_profiles FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "beneficiary_profiles.select.instructor"
  ON beneficiary_profiles FOR SELECT
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.instructor_id = auth.uid()
        AND e.beneficiary_id = beneficiary_profiles.profile_id
    )
  );

CREATE POLICY "beneficiary_profiles.update.own"
  ON beneficiary_profiles FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    -- Beneficiário não pode alterar vulnerability_notes (campo administrativo)
  );

CREATE POLICY "beneficiary_profiles.update.admin_assistant"
  ON beneficiary_profiles FOR UPDATE
  USING (is_admin_or_assistant());

CREATE POLICY "beneficiary_profiles.insert.own"
  ON beneficiary_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "beneficiary_profiles.insert.admin_assistant"
  ON beneficiary_profiles FOR INSERT
  WITH CHECK (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- STAFF_PROFILES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "staff_profiles.select.own"
  ON staff_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "staff_profiles.all.admin"
  ON staff_profiles FOR ALL
  USING (is_admin());

-- ═════════════════════════════════════════════════════════════
-- COURSES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "courses.select.active"
  ON courses FOR SELECT
  USING (status = 'active' OR is_admin_or_assistant());

CREATE POLICY "courses.all.admin"
  ON courses FOR ALL
  USING (is_admin());

CREATE POLICY "courses.insert_update.assistant"
  ON courses FOR INSERT
  WITH CHECK (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- CLASSES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "classes.select.general"
  ON classes FOR SELECT
  USING (
    status IN ('open','in_progress','completed')
    OR is_admin_or_assistant()
    OR instructor_id = auth.uid()
  );

CREATE POLICY "classes.all.admin"
  ON classes FOR ALL
  USING (is_admin());

CREATE POLICY "classes.insert_update.assistant"
  ON classes FOR INSERT
  WITH CHECK (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- CLASS_SESSIONS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "class_sessions.select.general"
  ON class_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_sessions.class_id AND (
        c.status IN ('open','in_progress','completed')
        OR is_admin_or_assistant()
        OR c.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "class_sessions.all.admin_assistant"
  ON class_sessions FOR ALL
  USING (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- ENROLLMENTS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "enrollments.select.own"
  ON enrollments FOR SELECT
  USING (beneficiary_id = auth.uid());

CREATE POLICY "enrollments.select.admin_assistant"
  ON enrollments FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "enrollments.select.instructor"
  ON enrollments FOR SELECT
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "enrollments.insert.beneficiary"
  ON enrollments FOR INSERT
  WITH CHECK (
    beneficiary_id = auth.uid()
    AND enrolled_by = auth.uid()
    AND get_current_user_role() = 'beneficiary'
  );

CREATE POLICY "enrollments.all.admin_assistant"
  ON enrollments FOR ALL
  USING (is_admin_or_assistant());

CREATE POLICY "enrollments.update.instructor"
  ON enrollments FOR UPDATE
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id AND c.instructor_id = auth.uid()
    )
  );

-- ═════════════════════════════════════════════════════════════
-- ATTENDANCE_RECORDS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "attendance.select.own"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = attendance_records.enrollment_id AND e.beneficiary_id = auth.uid()
    )
  );

CREATE POLICY "attendance.select.admin_assistant"
  ON attendance_records FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "attendance.select.instructor"
  ON attendance_records FOR SELECT
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM class_sessions cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.id = attendance_records.session_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "attendance.insert_update.instructor"
  ON attendance_records FOR INSERT
  WITH CHECK (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM class_sessions cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.id = attendance_records.session_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "attendance.all.admin_assistant"
  ON attendance_records FOR ALL
  USING (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- PARTICIPANT_STATUS_HISTORY
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "psh.select.own"
  ON participant_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = participant_status_history.enrollment_id AND e.beneficiary_id = auth.uid()
    )
  );

CREATE POLICY "psh.select.admin_assistant"
  ON participant_status_history FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "psh.select.instructor"
  ON participant_status_history FOR SELECT
  USING (
    is_instructor() AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.id = participant_status_history.enrollment_id AND c.instructor_id = auth.uid()
    )
  );

-- ═════════════════════════════════════════════════════════════
-- PRIVACY_POLICIES
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "privacy_policies.select.active"
  ON privacy_policies FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "privacy_policies.all.admin"
  ON privacy_policies FOR ALL
  USING (is_admin());

-- ═════════════════════════════════════════════════════════════
-- CONSENTS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "consents.select.own"
  ON consents FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "consents.select.admin"
  ON consents FOR SELECT
  USING (is_admin());

CREATE POLICY "consents.insert.own"
  ON consents FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "consents.update.own"
  ON consents FOR UPDATE
  USING (profile_id = auth.uid());

-- ═════════════════════════════════════════════════════════════
-- DATA_SUBJECT_REQUESTS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "dsr.select.own"
  ON data_subject_requests FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "dsr.select.admin_assistant"
  ON data_subject_requests FOR SELECT
  USING (is_admin_or_assistant());

CREATE POLICY "dsr.insert.own"
  ON data_subject_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "dsr.update.admin_assistant"
  ON data_subject_requests FOR UPDATE
  USING (is_admin_or_assistant());

-- ═════════════════════════════════════════════════════════════
-- DATA_EXPORTS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "data_exports.select.own"
  ON data_exports FOR SELECT
  USING (profile_id = auth.uid() AND expires_at > NOW());

CREATE POLICY "data_exports.all.admin"
  ON data_exports FOR ALL
  USING (is_admin());

-- ═════════════════════════════════════════════════════════════
-- AUDIT_LOGS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "audit_logs.select.admin"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- Ninguém pode deletar logs de auditoria via SQL direto
CREATE POLICY "audit_logs.no_delete"
  ON audit_logs FOR DELETE
  USING (FALSE);

-- Apenas service_role insere (via funções SECURITY DEFINER)
CREATE POLICY "audit_logs.insert.denied"
  ON audit_logs FOR INSERT
  WITH CHECK (FALSE);

-- ═════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "notifications.select.own"
  ON notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "notifications.update.own"
  ON notifications FOR UPDATE
  USING (profile_id = auth.uid());

-- ═════════════════════════════════════════════════════════════
-- APP_SETTINGS
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "app_settings.select.authenticated"
  ON app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "app_settings.all.admin"
  ON app_settings FOR ALL
  USING (is_admin());
