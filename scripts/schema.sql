-- book_memory 스키마 생성
CREATE SCHEMA IF NOT EXISTS book_memory;

-- books 테이블
CREATE TABLE IF NOT EXISTS book_memory.books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id    text UNIQUE,
  title        text NOT NULL,
  author       text,
  category     text,
  status       text,
  rating       smallint CHECK (rating >= 1 AND rating <= 5),
  keywords     text[] DEFAULT '{}',
  one_word     text[] DEFAULT '{}',
  summary      text,
  review       text,
  cover_url    text,
  read_start   date,
  read_end     date,
  notion_ai_url text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- book_pages 테이블
CREATE TABLE IF NOT EXISTS book_memory.book_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      uuid REFERENCES book_memory.books(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('highlight', 'memo', 'ai_chat', 'diary')),
  page_number  int,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- chat_history 테이블
CREATE TABLE IF NOT EXISTS book_memory.chat_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL,
  role         text NOT NULL CHECK (role IN ('user', 'assistant')),
  content      text NOT NULL,
  sources      jsonb,
  created_at   timestamptz DEFAULT now()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION book_memory.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON book_memory.books
  FOR EACH ROW EXECUTE FUNCTION book_memory.update_updated_at();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_books_status ON book_memory.books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON book_memory.books(category);
CREATE INDEX IF NOT EXISTS idx_books_rating ON book_memory.books(rating);
CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON book_memory.book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_content_type ON book_memory.book_pages(content_type);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON book_memory.chat_history(session_id);
