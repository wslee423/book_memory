# PLANS.md — book_memory 개발 로드맵

---

## 목표

Notion "나의 책장" 데이터를 Supabase로 이관하고, 책장 웹서비스(Phase 1~2)와 AI 독서메이트(Phase 3)를 순차적으로 구축한다.
운섭 1인 사용, 외부 공개 없음. 빠른 실사용을 목표로 Phase 2 완료 시 즉시 운용 시작.

---

## Phase 구조

| Phase | 이름 | 목표 | 상태 |
|-------|------|------|------|
| Phase 1 | 기반 세팅 | 개발 환경 + Supabase 스키마 + 마이그레이션 | ✅ |
| Phase 2 | 책장 MVP | 책 목록·상세·필터·검색 완성 | ✅ |
| Phase 3 | AI 독서메이트 | RAG 파이프라인 + 채팅 UI | ✅ |
| Phase 4 | 기능 완성 + 시니어 리뷰 | 메모 CRUD·통계·회고·책 등록·모바일·리뷰 반영 | ✅ |
| Phase 5 | 고도화 | merge-pages 실행·재임베딩·기능 고도화 | 🔲 |

상태: 🔲 미시작 / 🔄 진행 중 / ✅ 완료

---

## Phase 1 — 기반 세팅

**목표**: 개발 환경 + 스키마 + Notion 데이터 이관 완료. 이 Phase 없이 Phase 2 시작 불가.

### 완료 조건 (Phase Gate)
- [x] Next.js 14 프로젝트 초기화 (TypeScript strict, Tailwind)
- [x] Supabase 프로젝트 생성 + 스키마 적용 (books, book_pages, embeddings, chat_history)
- [x] RLS 정책 적용 확인
- [x] Notion → Supabase 마이그레이션 스크립트 완성
- [x] 마이그레이션 실행 완료 (전체 책 데이터 + 페이지 내용)
- [x] Vercel 배포 파이프라인 연결
- [x] typecheck/lint 경고 0건

### 작업 목록
- [x] Next.js 프로젝트 초기화
- [x] Supabase 설정 + 환경변수 (.env.local.example 작성)
- [x] DB 스키마 SQL 작성 (scripts/schema.sql) — 실행은 운섭 직접
- [x] RLS 정책 SQL 작성 (scripts/rls.sql) — 실행은 운섭 직접
- [x] TypeScript 타입 정의 (types/index.ts)
- [x] Notion API 클라이언트 (lib/notion/)
- [x] 마이그레이션 스크립트 완성 (scripts/migrate-notion.ts)
  - [x] books 테이블 이관 (129개)
  - [x] book_pages 테이블 이관 (1,277개 — 텍스트 1,183 + 이미지 94)
  - [x] 표지 이미지 URL 보존 (next.config.mjs 도메인 허용)
  - [x] 페이지 이미지 Supabase Storage 업로드 (94/96, 2건 TD-001)
- [x] Supabase 스키마 + RLS 실행 완료 (운섭 직접)
- [x] 마이그레이션 실행 완료 (129책 / 1,277 pages / 94 images)
- [x] Vercel 배포 파이프라인 연결

---

## Phase 2 — 책장 MVP

**목표**: 실제로 쓸 수 있는 나만의 책장 웹서비스.

### 완료 조건 (Phase Gate)
- [x] 책 목록 페이지 동작 (갤러리 뷰 + 표 뷰 전환)
- [x] 책 상세 페이지 동작 (메타데이터 + 페이지 내용)
- [x] 필터 동작 (상태 / 분류 / 별점 / 키워드)
- [x] 검색 동작 (제목·저자·내용 텍스트 검색)
- [x] typecheck/lint 경고 0건
- [x] Vercel 배포 후 실사용 시작

### 작업 목록
- [x] Supabase 클라이언트 함수 (lib/supabase/books.ts — fetchBooks/fetchBookById/fetchBookPages/fetchBookStats/fetchAllKeywords/fetchAdjacentBooks)
- [x] API Routes
  - [x] GET /api/books (목록, 필터, 검색)
  - [x] GET /api/books/[id] (상세 + 페이지 내용)
  - [ ] POST /api/books/[id]/pages (메모 추가 — book_pages 테이블 insert) — Phase 4로 이연
- [x] 책장 목록 UI
  - [x] 갤러리 뷰 (표지 이미지 중심)
  - [x] 표 뷰 (전체 메타데이터)
  - [x] 뷰 전환 토글
- [x] 필터 UI (상태, 분류, 별점, 키워드)
- [x] 검색 UI (300ms 디바운스)
- [x] 책 상세 UI
  - [x] 메타데이터 섹션 (별점, 기간, 키워드, 한줄 요약)
  - [x] 페이지 내용 뷰어 (content_type 탭별: 하이라이트·메모·AI 대화 구분)
  - [x] 이전/다음 책 네비게이션
- [x] 에러 상태 + 로딩 상태 처리 (/bookshelf/[id] — loading.tsx + error.tsx)
- [x] 매직링크 인증 콜백 라우트 (/auth/callback) 추가

**잔여 가독성 항목 (tech-debt 처리):** TD-002 ~ TD-005

---

## Phase 3 — AI 독서메이트

**목표**: 내 독서 기록에서 자연어로 찾고 연결하는 RAG 비서.

### 완료 조건 (Phase Gate)
- [x] 임베딩 생성 배치 완료 (전체 book_pages)
- [x] RAG 파이프라인 동작 확인
- [x] 채팅 UI 완성
- [x] 참조 출처(책명·페이지) 함께 표시
- [x] 응답 품질 자체 검증 (3가지 예시 질문 테스트)

### 작업 목록
- [x] 임베딩 모델 결정 (OD-001 처리) → OpenAI text-embedding-3-small (1536차원)
- [x] 임베딩 생성 API (`lib/rag/embed.ts`) — embedText, extractImageText(gpt-4o-mini vision), chunkText(단락 경계 분할)
- [x] 배치 임베딩 스크립트 (`scripts/embed-all.ts`) — image 800ms / text 50ms delay
- [x] RAG 검색 함수 (`lib/rag/search.ts`) — Supabase pgvector cosine 유사도
- [x] 시스템 프롬프트 (`lib/rag/prompts.ts`) — 한국어 시스템 프롬프트, 컨텍스트 블록
- [x] OpenAI 클라이언트 (`lib/openai/client.ts`) — lazy singleton getOpenAI()
- [x] API Route: POST `/api/mate/chat` — NDJSON 스트리밍, 입력 검증, UUID 검증
- [x] API Route: GET `/api/mate/history` — 채팅 기록 조회 (명시적 컬럼 선택)
- [x] 채팅 UI (`components/features/mate/`) — MateClient, SessionList, MessageList, ChatInput

**검증 예시 질문:**
1. "내가 불편함을 피하려고만 하면 발생하는 문제에 대해 읽었던 내용 찾아줘"
2. "자산관리 관련해서 읽은 책들의 핵심 메모 정리해줘"
3. "최근 별점 5개 준 책들의 공통점을 분석해줘"

---

## Phase 4 — 기능 완성 + 시니어 리뷰 반영

**목표**: 메모 CRUD·독서 통계·회고 타임라인·책 등록·모바일 반응형 완성, 시니어 리뷰 12개 항목 반영.

### 작업 목록
- [x] 메모 추가 UI (`components/bookshelf/MemoForm.tsx`)
- [x] 메모 수정/삭제 UI (`components/bookshelf/BookPageItem.tsx`) — hover 편집/삭제, 왼쪽 컬러 테두리
- [x] API: POST `/api/books/[id]/pages` — 메모 추가 + fire-and-forget 임베딩
- [x] API: PATCH/DELETE `/api/books/[id]/pages/[pageId]` — 임베딩 순서: 생성→삭제→삽입
- [x] 독서 통계 (`app/api/stats/route.ts`, `components/features/stats/StatsClient.tsx`) — CSS bar chart
- [x] 독서 회고 타임라인 (`app/timeline/page.tsx`, `app/api/books/timeline/route.ts`) — 월별 완독
- [x] 책 등록 (`components/bookshelf/BookForm.tsx`, `app/bookshelf/new/page.tsx`, `POST /api/books`)
- [x] 모바일 반응형 최적화 (GlobalNav, BookshelfClient, MateClient, BookForm, BookDetailClient)
- [x] 시니어 리뷰 반영 12개 항목
  - [x] `types/index.ts` — StatsData, TimelineBook, TimelineMonth 타입 이전
  - [x] `lib/openai/client.ts` — lazy getOpenAI() 패턴
  - [x] `lib/rag/embed.ts` — chunkText() 단락(\n\n) 경계 우선 분할
  - [x] `app/api/books/[id]/pages/[pageId]/route.ts` — 임베딩 갱신: 생성 성공 후 삭제 (데이터 유실 방지)
  - [x] `app/api/mate/chat/route.ts` — 메시지 2000자 제한, UUID 검증, top-K 상수화, application/x-ndjson
  - [x] `app/api/mate/history/route.ts` — 명시적 컬럼 선택
  - [x] `components/features/mate/MateClient.tsx` — import 순서
  - [x] `components/bookshelf/BookDetailClient.tsx` — 타입 캐스팅 제거, 명시적 image 타입 가드

---

## Phase 5 — 고도화

**목표**: 임베딩 품질 개선 + 기능 고도화.

### 작업 목록 (우선순위 미정)
- [ ] merge-pages 실행 — 분할된 메모 병합
- [ ] re-embed — 전체 재임베딩 (품질 개선)
- [ ] 다크모드
- [ ] TD 항목 해소 (TD-002 테스트 인프라, TD-003 함수 분리 등)

---

## 원칙

1. Phase Gate 통과 후 다음 Phase 진입
2. 동작하는 것 먼저 — 완벽함보다 실사용 우선
3. 데이터 손실 절대 금지 (CONSTITUTION 원칙 1)
