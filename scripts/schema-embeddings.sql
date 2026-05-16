-- ⚠️ OD-001 결정 후 실행: 임베딩 모델 선택에 따라 vector 차원 변경 필요
-- OpenAI text-embedding-3-small: vector(1536)
-- Anthropic: vector(1024)
-- 임베딩 모델 결정 전 이 파일 실행 금지

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS book_memory.embeddings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      uuid REFERENCES book_memory.books(id) ON DELETE CASCADE,
  page_id      uuid REFERENCES book_memory.book_pages(id) ON DELETE CASCADE,
  source_type  text NOT NULL CHECK (source_type IN ('book_meta', 'page_content')),
  content      text NOT NULL,
  embedding    vector(1536),  -- OD-001 결정 후 변경 (Anthropic 선택 시 vector(1024))
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector
  ON book_memory.embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
