-- Vincula cada atividade a uma aula específica da turma
ALTER TABLE class_activities
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_class_activities_session_id
  ON class_activities(session_id);
