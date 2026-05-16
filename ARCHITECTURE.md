# ARCHITECTURE.md — book_memory 기술 아키텍처

---

## 1. 기술 스택

| 역할 | 선택 | 선택 이유 |
|------|------|---------|
| Framework | Next.js 14 (App Router) | SSR/SSG 지원, API Route 통합, Vercel 최적화 |
| Language | TypeScript (strict) | 타입 안정성, 에이전트 코드 생성 품질 |
| Styling | Tailwind CSS | 빠른 UI 개발, 에이전트 친화적 클래스명 |
| Auth | Supabase Auth | 간단한 이메일 인증, 1인 사용자 |
| DB | Supabase PostgreSQL | RLS 지원, pgvector 통합, 관리형 |
| Vector DB | Supabase pgvector | 별도 서비스 불필요, PostgreSQL 내장 |
| AI | Anthropic Claude API | RAG 비서 구현 (claude-3-5-haiku 우선) |
| 배포 | Vercel | Next.js 네이티브 지원, 무료 플랜으로 1인 운영 가능 |

**기각한 대안:**
- Firebase: pgvector 미지원, RAG 구현 복잡
- Pinecone (벡터 DB 분리): 별도 비용·관리 오버헤드, Supabase 통합이 충분

---

## 2. 시스템 구조

```
┌─────────────────────────────────────────┐
│  브라우저 (Next.js App Router)           │
│                                          │
│  /bookshelf      — 책 목록 (Phase 2)    │
│  /bookshelf/[id] — 책 상세 + 메모 뷰어  │
│  /mate           — AI 독서메이트 (Phase 3)│
└──────────────┬──────────────────────────┘
               │ API Routes (모두 인증 필수)
┌──────────────▼──────────────────────────┐
│  Next.js API Layer (/app/api/)           │
│                                          │
│  /api/books         — 책 CRUD (Phase 2) │
│  /api/books/[id]    — 책 상세·메모      │
│  /api/mate/chat     — RAG 채팅 (Phase 3)│
│  /api/embed         — 임베딩 생성 (Phase 3)│
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Supabase                                │
│                                          │
│  books          — 책 메타데이터          │
│  book_pages     — 책별 메모·하이라이트   │
│  embeddings     — pgvector 임베딩        │
│  chat_history   — AI 대화 이력          │
└─────────────────────────────────────────┘
               │ 마이그레이션 시에만 (스크립트 직접 실행)
┌──────────────▼──────────────────────────┐
│  Notion API (읽기 전용, 백업 소스)        │
└─────────────────────────────────────────┘
```

> **마이그레이션 실행 방법**: `/admin/migrate` UI 라우트 없음.
> `scripts/migrate-notion.ts` 스크립트를 터미널에서 직접 실행한다.
> 상세: `docs/product-specs/migration.md`

---

## 3. DB 스키마 설계

### books (책 메타데이터)
```sql
create table books (
  id           uuid primary key default gen_random_uuid(),
  notion_id    text unique,          -- Notion 페이지 ID (역추적용)
  title        text not null,
  author       text,
  category     text,                 -- 분류 (에세이, 자기계발 등)
  status       text,                 -- 상태 (완독, 읽는 중 등)
  rating       smallint,             -- 별점 1~5
  keywords     text[],               -- 키워드 배열
  one_word     text[],               -- 한단어감상 배열
  summary      text,                 -- 한줄 요약
  review       text,                 -- 한 줄 평
  cover_url    text,                 -- 표지 이미지 URL
  read_start   date,
  read_end     date,
  notion_ai_url text,                -- 기존 Gemini 독서메이트 링크 (보존)
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

### book_pages (책별 메모·하이라이트·AI 대화)
```sql
create table book_pages (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid references books(id) on delete cascade,
  content_type text not null,        -- 'highlight' | 'memo' | 'ai_chat' | 'diary'
  page_number  int,                  -- 발췌 페이지 번호 (있는 경우)
  content      text not null,        -- 실제 텍스트
  created_at   timestamptz default now()
);
```

### embeddings (pgvector — RAG용)
```sql
create extension if not exists vector;

-- ⚠️ 벡터 차원은 OD-001 결정 후 확정
-- OpenAI text-embedding-3-small: 1536차원
-- Anthropic: 1024차원
-- 임베딩 모델 결정 전 스키마 실행 금지

create table embeddings (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid references books(id) on delete cascade,
  page_id      uuid references book_pages(id) on delete cascade, -- book_meta 타입은 NULL 허용
  source_type  text not null,        -- 'book_meta' | 'page_content'
  content      text not null,        -- 임베딩 원본 텍스트
  embedding    vector(1536),         -- 차원 수는 OD-001 결정 후 변경 가능
  created_at   timestamptz default now()
);

-- source_type별 제약 안내:
-- 'book_meta': page_id = NULL (책 메타데이터 임베딩)
-- 'page_content': page_id = 해당 book_pages.id

create index on embeddings using ivfflat (embedding vector_cosine_ops);
```

### chat_history (AI 독서메이트 대화 이력)
```sql
create table chat_history (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  role         text not null,        -- 'user' | 'assistant'
  content      text not null,
  sources      jsonb,                -- 참조한 book_id·page_id 목록
  created_at   timestamptz default now()
);
```

---

## 4. RAG 파이프라인 구조

```
사용자 질문 입력
    ↓
질문 임베딩 생성 (Anthropic / OpenAI Embedding API)
    ↓
pgvector 유사도 검색 (cosine similarity, top-k)
    ↓
관련 book_pages + books 메타데이터 조합
    ↓
컨텍스트 프롬프트 구성 (시스템 프롬프트 + 검색 결과 + 질문)
    ↓
Claude API 호출 (claude-3-5-haiku)
    ↓
응답 + 참조 출처(책명·페이지) 반환
    ↓
chat_history 저장
```

---

## 5. 폴더 구조

```
/app
  /api
    /books/route.ts              ← 책 목록 조회 (Phase 2)
    /books/[id]/route.ts         ← 책 상세 조회 (Phase 2)
    /books/[id]/pages/route.ts   ← 메모 추가 POST (Phase 2)
    /mate/chat/route.ts          ← RAG 채팅 (Phase 3)
    /embed/route.ts              ← 임베딩 생성 배치 (Phase 3)
  /bookshelf
    /page.tsx                    ← 책 목록 (갤러리/표 전환)
    /[id]/page.tsx               ← 책 상세 + 메모 뷰어
  /mate
    /page.tsx                    ← AI 독서메이트 채팅 UI
  /layout.tsx
/components
  /ui/                           ← Button, Badge, Card 등 원자 컴포넌트
  /features
    /bookshelf/                  ← 책장 관련 컴포넌트
    /mate/                       ← AI 메이트 채팅 컴포넌트
/lib
  /supabase/                     ← Supabase 클라이언트
  /anthropic/                    ← Claude API 클라이언트
  /notion/                       ← Notion API 클라이언트 (마이그레이션 스크립트용)
  /rag/                          ← RAG 파이프라인 유틸
  /utils/
/types
  /index.ts                      ← 공용 타입 정의
/scripts
  /migrate-notion.ts             ← 1회성 마이그레이션 스크립트 (터미널 직접 실행)
  /embed-all.ts                  ← 임베딩 일괄 생성 스크립트 (Phase 3)
```

---

## 6. 구현 순서 원칙

```
[Phase 1]
1. Supabase 스키마 + RLS 정책
2. TypeScript 타입 정의
3. Notion 마이그레이션 스크립트 (scripts/migrate-notion.ts)

[Phase 2]
4. Supabase 클라이언트 함수 (lib/supabase/)
5. API Routes (books, books/[id], books/[id]/pages)
6. 책장 UI (목록 → 상세 → 필터/검색)
7. 에러 처리 + 로딩 상태

[Phase 3]
8. 임베딩 모델 결정 (OD-001) → 스키마 vector 차원 확정
9. 임베딩 생성 배치 (scripts/embed-all.ts)
10. RAG 파이프라인 (lib/rag/)
11. API Route (mate/chat, embed)
12. AI 독서메이트 UI
```

---

## 7. 바꾸기 어려운 결정 (신중하게 변경)

- **Supabase 선택**: pgvector 통합, 스키마 전체에 영향
- **book_pages 분리 구조**: RAG 청킹 단위가 이 테이블 기준
- **Next.js App Router**: 라우팅 전략 전체에 영향

## 8. 나중에 바꿀 수 있는 결정

- 임베딩 모델 (OpenAI ↔ Anthropic)
- Claude 모델 버전 (haiku → sonnet 업그레이드)
- UI 컴포넌트 라이브러리 추가
- 배포 플랫폼 (Vercel → Railway)
