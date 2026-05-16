-- book_memory 스키마 RLS 활성화 (1인 사용자 — 인증된 사용자 전체 접근 허용)
-- 실행 전제: schema.sql 이 먼저 실행되어 있어야 한다.

ALTER TABLE book_memory.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_memory.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_memory.chat_history ENABLE ROW LEVEL SECURITY;

-- books 정책
CREATE POLICY "인증된 사용자 books 접근"
  ON book_memory.books
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- book_pages 정책
CREATE POLICY "인증된 사용자 book_pages 접근"
  ON book_memory.book_pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- chat_history 정책
CREATE POLICY "인증된 사용자 chat_history 접근"
  ON book_memory.chat_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 마이그레이션 스크립트용 service_role 정책 (anon 제외)
-- Service Role은 RLS bypass 가능하므로 별도 정책 불필요
