-- ============================================================
-- Migration 013: Informações da turma (local, sala, WhatsApp, avisos)
-- Execute no Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS room VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;

ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS room VARCHAR(100);

-- ─────────────────────────────────────────────────────────────
-- Avisos por turma
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_announcements (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id   UUID         NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  is_pinned  BOOLEAN      NOT NULL DEFAULT false,
  created_by UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_announcements_class_id
  ON class_announcements(class_id);

CREATE INDEX IF NOT EXISTS idx_class_announcements_pinned
  ON class_announcements(class_id, is_pinned DESC, created_at DESC);

DROP TRIGGER IF EXISTS trg_class_announcements_updated_at ON class_announcements;
CREATE TRIGGER trg_class_announcements_updated_at
  BEFORE UPDATE ON class_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Helpers RLS
-- ─────────────────────────────────────────────────────────────
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
      AND e.status IN ('confirmed', 'pending', 'waitlisted', 'completed')
  );
$$;

CREATE OR REPLACE FUNCTION is_class_instructor(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id
      AND c.instructor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_class_info(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_or_assistant() OR is_class_instructor(p_class_id);
$$;

-- Beneficiário inscrito vê turma mesmo em status planned
CREATE POLICY "classes.select.enrolled"
  ON classes FOR SELECT
  USING (is_enrolled_in_class(id));

-- Instrutor atualiza info da própria turma
CREATE POLICY "classes.update.instructor"
  ON classes FOR UPDATE
  USING (is_class_instructor(id))
  WITH CHECK (is_class_instructor(id));

-- Sessões: inscritos veem aulas da turma
CREATE POLICY "class_sessions.select.enrolled"
  ON class_sessions FOR SELECT
  USING (is_enrolled_in_class(class_id));

-- Sessões: instrutor gerencia própria turma
CREATE POLICY "class_sessions.all.instructor"
  ON class_sessions FOR ALL
  USING (is_class_instructor(class_id))
  WITH CHECK (is_class_instructor(class_id));

-- Avisos
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_announcements.select.viewers"
  ON class_announcements FOR SELECT
  USING (
    is_admin_or_assistant()
    OR is_class_instructor(class_id)
    OR is_enrolled_in_class(class_id)
  );

CREATE POLICY "class_announcements.all.managers"
  ON class_announcements FOR ALL
  USING (can_manage_class_info(class_id))
  WITH CHECK (can_manage_class_info(class_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON class_announcements TO authenticated;
