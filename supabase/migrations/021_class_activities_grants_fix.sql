-- ============================================================
-- Migration 021: Políticas RLS extras para atividades (idempotente)
-- Pré-requisito: migration 020 já executada
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON class_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_grades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON enrollment_report_cards TO authenticated;

GRANT ALL ON class_activities TO service_role;
GRANT ALL ON activity_grades TO service_role;
GRANT ALL ON enrollment_report_cards TO service_role;

DROP POLICY IF EXISTS "class_activities.insert.managers" ON class_activities;
DROP POLICY IF EXISTS "class_activities.update.managers" ON class_activities;
DROP POLICY IF EXISTS "class_activities.delete.managers" ON class_activities;

CREATE POLICY "class_activities.insert.managers"
  ON class_activities FOR INSERT
  WITH CHECK (can_manage_class_info(class_id));

CREATE POLICY "class_activities.update.managers"
  ON class_activities FOR UPDATE
  USING (can_manage_class_info(class_id))
  WITH CHECK (can_manage_class_info(class_id));

CREATE POLICY "class_activities.delete.managers"
  ON class_activities FOR DELETE
  USING (can_manage_class_info(class_id));

DROP POLICY IF EXISTS "activity_grades.insert.managers" ON activity_grades;
DROP POLICY IF EXISTS "activity_grades.update.managers" ON activity_grades;
DROP POLICY IF EXISTS "activity_grades.delete.managers" ON activity_grades;

CREATE POLICY "activity_grades.insert.managers"
  ON activity_grades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_activities ca
      WHERE ca.id = activity_grades.activity_id
        AND can_manage_class_info(ca.class_id)
    )
  );

CREATE POLICY "activity_grades.update.managers"
  ON activity_grades FOR UPDATE
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

CREATE POLICY "activity_grades.delete.managers"
  ON activity_grades FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM class_activities ca
      WHERE ca.id = activity_grades.activity_id
        AND can_manage_class_info(ca.class_id)
    )
  );
