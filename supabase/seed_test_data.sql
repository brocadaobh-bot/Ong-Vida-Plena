-- ============================================================
-- SEED DE TESTE — Vida Plena
-- Cole no Supabase → SQL Editor → Run
--
-- ANTES DE EXECUTAR: troque o e-mail na linha abaixo pelo seu!
-- ============================================================

DO $$
DECLARE
  v_email        TEXT := 'SEU_EMAIL_AQUI@exemplo.com';  -- ← TROQUE AQUI
  v_admin_id     UUID;
  v_course_id    UUID;
  v_class_id     UUID;
  v_session_id   UUID;
BEGIN
  -- ── 1) Localiza seu usuário ──────────────────────────────
  SELECT id INTO v_admin_id
  FROM public.profiles
  WHERE email = v_email;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %. Cadastre-se primeiro em /cadastro', v_email;
  END IF;

  -- ── 2) Confirma e-mail (evita bloqueio de login em dev) ──
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE email = v_email;

  -- ── 3) Promove a admin ───────────────────────────────────
  UPDATE public.profiles
  SET role = 'admin', status = 'active'
  WHERE id = v_admin_id;

  -- ── 4) Curso de teste (idempotente) ──────────────────────
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE title = 'Informática Básica — Teste'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (
      title, description, category, workload_hours, requirements, status, created_by
    ) VALUES (
      'Informática Básica — Teste',
      'Curso de demonstração para validar inscrições, turmas e presença na plataforma Vida Plena.',
      'digital_inclusion',
      40,
      'Saber ler e escrever. Não é necessário conhecimento prévio em informática.',
      'active',
      v_admin_id
    )
    RETURNING id INTO v_course_id;
  ELSE
    UPDATE public.courses
    SET status = 'active', created_by = v_admin_id
    WHERE id = v_course_id;
  END IF;

  -- ── 5) Turma aberta (idempotente) ────────────────────────
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE course_id = v_course_id AND name = 'Turma Teste 2026 — Manhã'
  LIMIT 1;

  IF v_class_id IS NULL THEN
    INSERT INTO public.classes (
      course_id, instructor_id, name, start_date, end_date,
      capacity, location, schedule_description, status
    ) VALUES (
      v_course_id,
      v_admin_id,
      'Turma Teste 2026 — Manhã',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '90 days',
      30,
      'Sede ONG Vida Plena — Sala 1',
      'Segundas e quartas, 09h às 11h',
      'open'
    )
    RETURNING id INTO v_class_id;
  ELSE
    UPDATE public.classes
    SET
      instructor_id = v_admin_id,
      status        = 'open',
      capacity      = 30
    WHERE id = v_class_id;
  END IF;

  -- ── 6) Sessão de aula de teste ───────────────────────────
  SELECT id INTO v_session_id
  FROM public.class_sessions
  WHERE class_id = v_class_id AND topic = 'Aula 1 — Introdução'
  LIMIT 1;

  IF v_session_id IS NULL THEN
    INSERT INTO public.class_sessions (
      class_id, session_date, start_time, end_time, topic, status
    ) VALUES (
      v_class_id,
      CURRENT_DATE + INTERVAL '7 days',
      '09:00'::time,
      '11:00'::time,
      'Aula 1 — Introdução',
      'scheduled'
    )
    RETURNING id INTO v_session_id;
  END IF;

  RAISE NOTICE '✅ Seed concluído!';
  RAISE NOTICE '   E-mail:    %', v_email;
  RAISE NOTICE '   Papel:     admin (+ instrutor da turma teste)';
  RAISE NOTICE '   Curso ID:  %', v_course_id;
  RAISE NOTICE '   Turma ID:  %', v_class_id;
  RAISE NOTICE '   Sessão ID: %', v_session_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Logout + login em http://localhost:3000/login';
  RAISE NOTICE '  2. Acesse /admin e /beneficiario/cursos';
  RAISE NOTICE '  3. Para testar inscrição como beneficiário, rode o bloco opcional abaixo';
END $$;

-- ── Configurações recomendadas para dev (plano gratuito Supabase) ──
UPDATE public.app_settings
SET value = 'false'::jsonb
WHERE key = 'require_email_confirmation';

-- ── 7) Conferência ─────────────────────────────────────────
SELECT
  p.email,
  p.full_name,
  p.role,
  p.status,
  u.email_confirmed_at IS NOT NULL AS email_confirmado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'SEU_EMAIL_AQUI@exemplo.com';  -- ← TROQUE AQUI TAMBÉM

SELECT c.title AS curso, cl.name AS turma, cl.status, cl.capacity, p.full_name AS instrutor
FROM public.classes cl
JOIN public.courses c ON c.id = cl.course_id
LEFT JOIN public.profiles p ON p.id = cl.instructor_id
WHERE c.title = 'Informática Básica — Teste';

-- ============================================================
-- OPCIONAL: testar inscrição como beneficiário
-- Rode DEPOIS do script acima, com OUTRO e-mail cadastrado
-- ============================================================
/*
DO $$
DECLARE
  v_beneficiary_email TEXT := 'outro_email@exemplo.com';  -- beneficiário de teste
  v_beneficiary_id    UUID;
  v_class_id          UUID;
BEGIN
  SELECT id INTO v_beneficiary_id FROM public.profiles WHERE email = v_beneficiary_email;
  SELECT id INTO v_class_id FROM public.classes WHERE name = 'Turma Teste 2026 — Manhã' LIMIT 1;

  IF v_beneficiary_id IS NULL OR v_class_id IS NULL THEN
    RAISE EXCEPTION 'Beneficiário ou turma não encontrados';
  END IF;

  UPDATE public.profiles SET role = 'beneficiary' WHERE id = v_beneficiary_id;

  INSERT INTO public.enrollments (beneficiary_id, class_id, status)
  VALUES (v_beneficiary_id, v_class_id, 'confirmed')
  ON CONFLICT (beneficiary_id, class_id) DO UPDATE SET status = 'confirmed';

  RAISE NOTICE 'Inscrição confirmada para %', v_beneficiary_email;
END $$;
*/

-- ============================================================
-- OPCIONAL: voltar seu usuário para beneficiário (só inscrição)
-- ============================================================
/*
UPDATE public.profiles SET role = 'beneficiary' WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
-- Depois: logout, login, acesse /beneficiario/cursos e inscreva-se na turma teste
*/

-- ============================================================
-- OPCIONAL: testar papel assistente
-- ============================================================
/*
UPDATE public.profiles SET role = 'assistant' WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
*/

-- ============================================================
-- OPCIONAL: testar papel instrutor (sem ser admin)
-- ============================================================
/*
UPDATE public.profiles SET role = 'instructor' WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
*/
