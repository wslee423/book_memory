-- OD-001 결정 완료: OpenAI text-embedding-3-small → vector(1536)
-- 실행 전제: schema.sql 이 먼저 실행되어 있어야 한다.

CREATE EXTENSION IF NOT EXISTS vector;

-- embeddings 테이블
CREATE TABLE IF NOT EXISTS book_memory.embeddings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      uuid REFERENCES book_memory.books(id) ON DELETE CASCADE,
  page_id      uuid REFERENCES book_memory.book_pages(id) ON DELETE CASCADE,
  source_type  text NOT NULL CHECK (source_type IN ('book_meta', 'page_content')),
  content      text NOT NULL,
  embedding    vector(1536),
  created_at   timestamptz DEFAULT now()
);

-- ivfflat 인덱스 (cosine 유사도)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
  ON book_memory.embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS
ALTER TABLE book_memory.embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증된 사용자 embeddings 읽기"
  ON book_memory.embeddings
  FOR SELECT
  TO authenticated
  USING (true);

-- 유사도 검색 RPC 함수
CREATE OR REPLACE FUNCTION book_memory.search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id          uuid,
  book_id     uuid,
  page_id     uuid,
  source_type text,
  content     text,
  similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.book_id,
    e.page_id,
    e.source_type,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM book_memory.embeddings e
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
