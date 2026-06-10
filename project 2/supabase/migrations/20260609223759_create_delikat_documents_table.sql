CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS delikat_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delikat_documents_embedding_idx
  ON delikat_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE delikat_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_delikat_documents" ON delikat_documents
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_delikat_documents" ON delikat_documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE OR REPLACE FUNCTION match_delikat_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM delikat_documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
