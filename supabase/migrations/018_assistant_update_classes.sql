-- Assistente administrativo pode atualizar turmas (ex.: atribuir instrutor)
CREATE POLICY "classes.update.assistant"
  ON classes FOR UPDATE
  USING (is_admin_or_assistant())
  WITH CHECK (is_admin_or_assistant());
