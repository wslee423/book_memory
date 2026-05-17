# NEXT_SESSION.md — 세션 인수인계

> 마지막 업데이트: 2026-05-17

---

## 현재 상태

| 항목 | 내용 |
|------|------|
| 현재 Phase | Phase 4 완료 / Phase 5 대기 |
| 마지막 완료 작업 | Phase 3 AI 독서메이트 + Phase 4 기능 완성 + 시니어 리뷰 12개 항목 반영 |
| 다음 작업 | Phase 5 고도화 착수 — merge-pages 실행 or re-embed or 타입 강화 순서 운섭 결정 |

---

## Phase 3 완료 요약 — AI 독서메이트

| 구현 항목 | 파일 |
|----------|------|
| 임베딩 생성 (embedText, extractImageText, chunkText) | `lib/rag/embed.ts` |
| pgvector cosine 유사도 검색 | `lib/rag/search.ts` |
| 한국어 시스템 프롬프트 | `lib/rag/prompts.ts` |
| lazy singleton OpenAI 클라이언트 | `lib/openai/client.ts` |
| 채팅 API (NDJSON 스트리밍, 입력 검증) | `app/api/mate/chat/route.ts` |
| 채팅 기록 API | `app/api/mate/history/route.ts` |
| 전체 임베딩 배치 스크립트 | `scripts/embed-all.ts` |
| 채팅 UI (MateClient, SessionList, MessageList, ChatInput) | `components/features/mate/` |

---

## Phase 4 완료 요약 — 기능 완성 + 시니어 리뷰

### 추가된 기능

| 구현 항목 | 파일 |
|----------|------|
| 메모 추가/수정/삭제 API | `app/api/books/[id]/pages/route.ts`, `app/api/books/[id]/pages/[pageId]/route.ts` |
| 메모 인라인 UI | `components/bookshelf/MemoForm.tsx`, `components/bookshelf/BookPageItem.tsx` |
| 독서 통계 API + UI | `app/api/stats/route.ts`, `components/features/stats/StatsClient.tsx` |
| 독서 회고 타임라인 | `app/timeline/page.tsx`, `app/api/books/timeline/route.ts` |
| 책 등록 | `components/bookshelf/BookForm.tsx`, `app/bookshelf/new/page.tsx`, POST `app/api/books/route.ts` |
| 모바일 반응형 | GlobalNav, BookshelfClient, MateClient, BookForm, BookDetailClient |

### 시니어 리뷰 12개 항목 반영 완료

- `types/index.ts` — StatsData, TimelineBook, TimelineMonth 타입 중앙화
- `lib/openai/client.ts` — lazy getOpenAI() 패턴 (모듈 로드 시 즉시 초기화 제거)
- `lib/rag/embed.ts` — chunkText() 단락(\n\n) 경계 우선 분할
- `app/api/books/[id]/pages/[pageId]/route.ts` — 임베딩 갱신 순서: 생성 성공 후 삭제 (데이터 유실 방지)
- `app/api/mate/chat/route.ts` — 메시지 2000자 제한, UUID 형식 검증, top-K 상수화, Content-Type application/x-ndjson
- `app/api/mate/history/route.ts` — select('*') → 명시적 컬럼 선택
- `components/features/mate/MateClient.tsx` — import 순서 수정
- `components/bookshelf/BookDetailClient.tsx` — 타입 캐스팅 제거, 명시적 image 타입 가드

---

## 다음 세션 작업 후보 (Phase 5)

### 옵션 A — merge-pages 실행

분할된 메모 병합 스크립트 실행. 임베딩 품질 개선의 전제 조건.

1. merge-pages 스크립트 설계 + 운섭 승인
2. 실행 (Supabase book_pages 변경 → 운섭 직접 실행 또는 스크립트 경유)
3. 결과 검증

### 옵션 B — re-embed (전체 재임베딩)

현재 chunkText 개선(단락 경계 분할) 이전에 생성된 임베딩 갱신.

1. TD-012, TD-013 해소 (exponential backoff + N+1 쿼리 개선) 후 실행
2. `scripts/embed-all.ts` 개선
3. 전체 재임베딩 실행

### 옵션 C — 타입 강화 (TD-015)

`Book.status` enum 타입화. 코드베이스 전반 `string | null` → 리터럴 union 타입 교체.

### 옵션 D — TD-002 테스트 인프라

운섭 승인 후 vitest/@testing-library/react 추가 + 핵심 경로 테스트 작성.

---

## 기술 부채 현황

| ID | 내용 | 심각도 | 해결 예정 |
|----|------|--------|---------|
| TD-001 | 이미지 2건 Notion S3 fallback — 만료 위험 | Low | Phase 5 |
| TD-002 | 테스트 인프라 부재 (vitest 미설치) | Medium | 운섭 승인 후 |
| TD-003 | 함수 50줄 초과 3건 (가독성) | Low | Phase 5 리팩터링 |
| TD-005 | `/bookshelf` 루트 loading.tsx + error.tsx 미존재 | Low | 체감 후 판단 |
| TD-006 | `fetchAdjacentBooks` 전체 fetch 후 메모리 findIndex | Low | 데이터 증가 시 |
| TD-007 | `fetchBookStats`/`fetchAllKeywords` 클라이언트 집계 | Low | 데이터 증가 시 |
| TD-008 | `BookGallery` `next/image` sizes prop 누락 | Low | Phase 5 UX 라운드 |
| TD-009 | ILIKE 풀스캔 (leading wildcard) | Low | RAG 강화 시 |
| TD-010 | 페이지 이미지 `<img>` 사용 (next/image 미전환) | Low | 활용도 따라 결정 |
| TD-011 | `book_pages.content_type` CHECK 제약 정합성 미확인 | Low | 다음 스키마 변경 시 |
| TD-012 | `embed-all.ts` Rate Limit 하드코딩 delay — exponential backoff 없음 | Low | Phase 5 재임베딩 전 |
| TD-013 | `embed-all.ts` N+1 쿼리 패턴 | Low | Phase 5 재임베딩 전 |
| TD-014 | stats/timeline 페이지 — API route와 DB 집계 로직 중복 | Low | Phase 5 리팩터링 |
| TD-015 | `Book.status` string \| null — enum 타입 없음 | Medium | Phase 5 타입 강화 |

---

## 미결 의사결정

현재 미결 항목 없음. (OD-001, OD-002, OD-003 모두 반영 완료)

---

## 참고

- GitHub: `https://github.com/wslee423/book_memory.git`
- Supabase URL: `https://lubknrqpyyhtnbkoruhq.supabase.co`
- Storage bucket: `book-media` (public)
- 임베딩 배치 실행: `npm run embed-all` (embed-all.ts)
- 마이그레이션 재실행: `npm run migrate` (upsert — 중복 없음)

---

## 다음 세션 핸드오프

**현재 Phase**: Phase 4 완료, Phase 5 대기

**마지막 완료**: Phase 3 AI 독서메이트 + Phase 4 기능 완성(메모 CRUD, 통계, 타임라인, 책 등록, 모바일) + 시니어 리뷰 12개 항목 반영

**다음 할 것**:
- 운섭이 옵션 A(merge-pages) / B(re-embed) / C(타입 강화) / D(테스트 인프라) 중 결정
- merge-pages 또는 re-embed 시 → Supabase 스키마 변경 없으면 Claude 직접 실행 가능, 변경 있으면 운섭 직접 실행

**세션 종료 시각**: 2026-05-17
