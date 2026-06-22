-- ============================================================
-- PROMOVER CONTAS ADMIN (principal + backup)
-- Cole no Supabase → SQL Editor → Run
--
-- PASSO A PASSO:
-- 1. Cadastre cada e-mail em /cadastro (ou peça para alguém cadastrar)
-- 2. Troque os e-mails abaixo pelos reais
-- 3. Execute este script
-- ============================================================

DO $$
DECLARE
  v_emails TEXT[] := ARRAY[
    'admin.principal@exemplo.com',   -- ← sua conta principal
    'admin.backup@exemplo.com'       -- ← segunda conta admin (reserva)
  ];
  v_email  TEXT;
  v_user_id UUID;
  v_found  INT := 0;
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE p.email = v_email;

    IF v_user_id IS NULL THEN
      RAISE NOTICE '⚠ E-mail não encontrado (cadastre primeiro em /cadastro): %', v_email;
      CONTINUE;
    END IF;

    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = v_email;

    UPDATE public.profiles
    SET role = 'admin', status = 'active'
    WHERE id = v_user_id;

    v_found := v_found + 1;
    RAISE NOTICE '✅ Admin ativo: % (id: %)', v_email, v_user_id;
  END LOOP;

  IF v_found = 0 THEN
    RAISE EXCEPTION 'Nenhum e-mail encontrado. Cadastre-se em /cadastro antes de rodar este script.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Pronto! % conta(s) admin. Guarde as senhas em local seguro.', v_found;
  RAISE NOTICE 'Recomendado: e-mails diferentes, senhas diferentes, recuperação testada.';
END $$;

-- Conferência
SELECT p.email, p.full_name, p.role, p.status,
       u.email_confirmed_at IS NOT NULL AS email_confirmado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.email;
