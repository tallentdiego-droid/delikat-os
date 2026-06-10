CREATE POLICY "anon_update_delikat_documents" ON delikat_documents
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
