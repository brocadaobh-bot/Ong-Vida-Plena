-- ============================================================

-- Migration 030: Conversa bidirecional em solicitações LGPD + anexos

-- Reaplicável (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ============================================================



CREATE TABLE IF NOT EXISTS data_subject_request_messages (

  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  request_id       UUID        NOT NULL REFERENCES data_subject_requests(id) ON DELETE CASCADE,

  sender_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  body             TEXT        NOT NULL,

  attachment_path  TEXT,

  attachment_name  TEXT,

  attachment_mime  TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),



  CONSTRAINT dsr_messages_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)

);



CREATE INDEX IF NOT EXISTS idx_dsr_messages_request_id

  ON data_subject_request_messages(request_id, created_at);



ALTER TABLE data_subject_request_messages ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "dsr_messages.select.own_request" ON data_subject_request_messages;

CREATE POLICY "dsr_messages.select.own_request"

  ON data_subject_request_messages FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM data_subject_requests dsr

      WHERE dsr.id = data_subject_request_messages.request_id

        AND dsr.profile_id = auth.uid()

    )

    OR is_admin_or_assistant()

  );



DROP POLICY IF EXISTS "dsr_messages.insert.own_request" ON data_subject_request_messages;

CREATE POLICY "dsr_messages.insert.own_request"

  ON data_subject_request_messages FOR INSERT

  WITH CHECK (

    sender_id = auth.uid()

    AND EXISTS (

      SELECT 1 FROM data_subject_requests dsr

      WHERE dsr.id = data_subject_request_messages.request_id

        AND dsr.profile_id = auth.uid()

        AND dsr.status IN ('open', 'in_review', 'waiting_user')

    )

  );



DROP POLICY IF EXISTS "dsr_messages.insert.staff" ON data_subject_request_messages;

CREATE POLICY "dsr_messages.insert.staff"

  ON data_subject_request_messages FOR INSERT

  WITH CHECK (

    sender_id = auth.uid()

    AND is_admin_or_assistant()

    AND EXISTS (

      SELECT 1 FROM data_subject_requests dsr

      WHERE dsr.id = data_subject_request_messages.request_id

        AND dsr.status IN ('open', 'in_review', 'waiting_user')

    )

  );



GRANT SELECT, INSERT ON data_subject_request_messages TO authenticated;



-- Bucket privado para documentos de identidade (RG etc.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)

VALUES (

  'lgpd-attachments',

  'lgpd-attachments',

  false,

  5242880,

  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

)

ON CONFLICT (id) DO NOTHING;



DROP POLICY IF EXISTS "lgpd_storage_select_staff" ON storage.objects;

CREATE POLICY "lgpd_storage_select_staff"

  ON storage.objects FOR SELECT

  TO authenticated

  USING (bucket_id = 'lgpd-attachments' AND is_admin_or_assistant());



DROP POLICY IF EXISTS "lgpd_storage_select_own" ON storage.objects;

CREATE POLICY "lgpd_storage_select_own"

  ON storage.objects FOR SELECT

  TO authenticated

  USING (

    bucket_id = 'lgpd-attachments'

    AND EXISTS (

      SELECT 1

      FROM data_subject_requests dsr

      WHERE dsr.profile_id = auth.uid()

        AND (storage.foldername(name))[1] = dsr.id::text

    )

  );



DROP POLICY IF EXISTS "lgpd_storage_insert_own" ON storage.objects;

CREATE POLICY "lgpd_storage_insert_own"

  ON storage.objects FOR INSERT

  TO authenticated

  WITH CHECK (

    bucket_id = 'lgpd-attachments'

    AND EXISTS (

      SELECT 1

      FROM data_subject_requests dsr

      WHERE dsr.profile_id = auth.uid()

        AND dsr.status IN ('open', 'in_review', 'waiting_user')

        AND (storage.foldername(name))[1] = dsr.id::text

    )

  );



DROP POLICY IF EXISTS "lgpd_storage_insert_staff" ON storage.objects;

CREATE POLICY "lgpd_storage_insert_staff"

  ON storage.objects FOR INSERT

  TO authenticated

  WITH CHECK (

    bucket_id = 'lgpd-attachments'

    AND is_admin_or_assistant()

  );

