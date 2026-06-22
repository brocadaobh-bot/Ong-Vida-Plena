-- ============================================================
-- Migration 020: Atividades, notas, boletim e recuperação
-- Pré-requisito: migration 019_enrollment_recovery_enum.sql já executada
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Atividades da turma (trabalhos, avaliações)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_activities (
  id                 UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id           UUID           NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title              VARCHAR(255)   NOT NULL,
  description        TEXT,
  max_score          NUMERIC(6,2)   NOT NULL DEFAULT 10 CHECK (max_score > 0),
  min_passing_score  NUMERIC(6,2)   NOT NULL DEFAULT 6 CHECK (min_passing_score >= 0),
  sort_order         INT            NOT NULL DEFAULT 0,
  created_by         UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_activities_class_id
  ON class_activities(class_id, sort_order);

DROP TRIGGER IF EXISTS trg_class_activities_updated_at ON class_activities;
CREATE TRIGGER trg_class_activities_updated_at
  BEFORE UPDATE ON class_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Notas por aluno / atividade
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_grades (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id    UUID           NOT NULL REFERENCES class_activities(id) ON DELETE CASCADE,
  enrollment_id  UUID           NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  score          NUMERIC(6,2)   NOT NULL CHECK (score >= 0),
  feedback       TEXT,
  graded_by      UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (activity_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_grades_enrollment
  ON activity_grades(enrollment_id);

DROP TRIGGER IF EXISTS trg_activity_grades_updated_at ON activity_grades;
CREATE TRIGGER trg_activity_grades_updated_at
  BEFORE UPDATE ON activity_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Boletim (snapshot gerado na conclusão / reavaliação)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment_report_cards (
  id                   UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id        UUID           NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  class_id             UUID           NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  attendance_percent   NUMERIC(5,2)   NOT NULL DEFAULT 0,
  average_score        NUMERIC(6,2),
  activities_total     INT            NOT NULL DEFAULT 0,
  activities_passed    INT            NOT NULL DEFAULT 0,
  approved             BOOLEAN        NOT NULL DEFAULT false,
  generated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  recovery_reopened_at TIMESTAMPTZ,
  recovery_reopened_by UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_cards_class
  ON enrollment_report_cards(class_id);

DROP TRIGGER IF EXISTS trg_report_cards_updated_at ON enrollment_report_cards;
CREATE TRIGGER trg_report_cards_updated_at
  BEFORE UPDATE ON enrollment_report_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inscritos em recuperação também veem conteúdo da turma
CREATE OR REPLACE FUNCTION is_enrolled_in_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.class_id = p_class_id
      AND e.beneficiary_id = auth.uid()
      AND e.status IN ('confirmed', 'pending', 'waitlisted', 'completed', 'recovery')
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE class_activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_grades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_report_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_activities.select.viewers" ON class_activities;
DROP POLICY IF EXISTS "class_activities.all.managers" ON class_activities;

CREATE POLICY "class_activities.select.viewers"
  ON class_activities FOR SELECT
  USING (
    is_admin_or_assistant()
    OR is_class_instructor(class_id)
    OR is_enrolled_in_class(class_id)
  );

CREATE POLICY "class_activities.all.managers"
  ON class_activities FOR ALL
  USING (can_manage_class_info(class_id))
  WITH CHECK (can_manage_class_info(class_id));

DROP POLICY IF EXISTS "activity_grades.select.viewers" ON activity_grades;
DROP POLICY IF EXISTS "activity_grades.all.managers" ON activity_grades;

CREATE POLICY "activity_grades.select.viewers"
  ON activity_grades FOR SELECT
  USING (
    is_admin_or_assistant()
    OR EXISTS (
      SELECT 1 FROM class_activities ca
      JOIN classes c ON c.id = ca.class_id
      WHERE ca.id = activity_grades.activity_id
        AND (is_class_instructor(c.id) OR is_enrolled_in_class(c.id))
    )
  );

CREATE POLICY "activity_grades.all.managers"
  ON activity_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM class_activities ca
      WHERE ca.id = activity_grades.activity_id
        AND can_manage_class_info(ca.class_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_activities ca
      WHERE ca.id = activity_grades.activity_id
        AND can_manage_class_info(ca.class_id)
    )
  );

DROP POLICY IF EXISTS "report_cards.select.viewers" ON enrollment_report_cards;
DROP POLICY IF EXISTS "report_cards.all.managers" ON enrollment_report_cards;

CREATE POLICY "report_cards.select.viewers"
  ON enrollment_report_cards FOR SELECT
  USING (
    is_admin_or_assistant()
    OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollment_report_cards.class_id
        AND is_class_instructor(c.id)
    )
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = enrollment_report_cards.enrollment_id
        AND e.beneficiary_id = auth.uid()
    )
  );

CREATE POLICY "report_cards.all.managers"
  ON enrollment_report_cards FOR ALL
  USING (
    is_admin_or_assistant()
    OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollment_report_cards.class_id
        AND is_class_instructor(c.id)
    )
  )
  WITH CHECK (
    is_admin_or_assistant()
    OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollment_report_cards.class_id
        AND is_class_instructor(c.id)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON class_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_grades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON enrollment_report_cards TO authenticated;

GRANT ALL ON class_activities TO service_role;
GRANT ALL ON activity_grades TO service_role;
GRANT ALL ON enrollment_report_cards TO service_role;
