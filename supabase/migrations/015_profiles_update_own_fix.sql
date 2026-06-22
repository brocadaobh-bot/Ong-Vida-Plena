-- ============================================================
-- Migration 015: Corrige UPDATE do próprio perfil (RLS)
-- A política anterior podia bloquear alteração de nome/status
-- Execute no Supabase → SQL Editor → Run
-- ============================================================

DROP POLICY IF EXISTS "profiles.update.own" ON profiles;

CREATE POLICY "profiles.update.own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = get_current_user_role()
    AND status = (
      SELECT p.status
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );
