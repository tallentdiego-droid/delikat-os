
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_path text,
  file_size bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_documents" ON documents
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_documents" ON documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_documents" ON documents
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_documents" ON documents
  FOR DELETE TO anon USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload_documents_storage" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "anon_select_documents_storage" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "anon_delete_documents_storage" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'documents');
