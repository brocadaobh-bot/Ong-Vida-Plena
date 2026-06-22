-- ============================================================
-- Migration 004: Tabelas de Inscrições e Presença
-- enrollments, attendance_records, participant_status_history
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tabela: enrollments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
  id                  UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id      UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id            UUID              NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status              enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_by         UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  enrolled_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Impede inscrição duplicada do mesmo beneficiário na mesma turma
  CONSTRAINT unique_enrollment UNIQUE (beneficiary_id, class_id)
);

CREATE INDEX idx_enrollments_beneficiary_id ON enrollments(beneficiary_id);
CREATE INDEX idx_enrollments_class_id       ON enrollments(class_id);
CREATE INDEX idx_enrollments_status         ON enrollments(status);
CREATE INDEX idx_enrollments_enrolled_at    ON enrollments(enrolled_at DESC);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: attendance_records
-- Registro de presença por sessão
-- ─────────────────────────────────────────────────────────────
CREATE TABLE attendance_records (
  id            UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID              NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID              NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  status        attendance_status NOT NULL DEFAULT 'absent',
  recorded_by   UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  notes         TEXT,
  recorded_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Impede duplicidade de registro por sessão/inscrição
  CONSTRAINT unique_attendance UNIQUE (session_id, enrollment_id)
);

CREATE INDEX idx_attendance_session_id    ON attendance_records(session_id);
CREATE INDEX idx_attendance_enrollment_id ON attendance_records(enrollment_id);
CREATE INDEX idx_attendance_status        ON attendance_records(status);

CREATE TRIGGER trg_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: participant_status_history
-- Histórico de mudanças de status de inscrição
-- ─────────────────────────────────────────────────────────────
CREATE TABLE participant_status_history (
  id            UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID              NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  old_status    enrollment_status,
  new_status    enrollment_status NOT NULL,
  changed_by    UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_psh_enrollment_id ON participant_status_history(enrollment_id);
CREATE INDEX idx_psh_created_at    ON participant_status_history(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Trigger: registra histórico automaticamente ao alterar status
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_enrollment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO participant_status_history (enrollment_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_enrollment_status_change
  AFTER UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION log_enrollment_status_change();
