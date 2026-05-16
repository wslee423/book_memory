# NEXT_SESSION.md — 세션 인수인계

> 마지막 업데이트: 2026-05-17

---

## 현재 상태

| 항목 | 내용 |
|------|------|
| 현재 Phase | Phase 2 완료 / Phase 3 대기 |
| 마지막 완료 작업 | Phase 2 책장 MVP 전체 구현 + Vercel 자동 배포 확인 |
| 다음 작업 | Phase 3(AI 독서메이트) 착수 또는 TD-002(테스트 인프라) 선행 — 운섭 결정 |

---

## Phase 1 & 2 완료 요약

**Phase 1 (기반 세팅):** Vercel 배포 파이프라인 포함 모든 Gate 항목 완료.

**Phase 2 (책장 MVP):** 핵심 기능 전부 완료. 잔여 가독성 항목 4건 tech-debt 처리.

| 구현 항목 | 파일 |
|----------|------|
| DB Layer (6개 함수) | `lib/supabase/books.ts` |
| API: GET /api/books | `app/api/books/route.ts` |
| API: GET /api/books/[id] | `app/api/books/[id]/route.ts` |
| Auth 콜백 | `app/auth/callback/route.ts` |
| 책장 목록 (갤러리/표 뷰, 필터, 검색, 통계) | `app/bookshelf/page.tsx`, `components/bookshelf/` |
| 책 상세 (메타, 탭별 페이지, 이전/다음) | `app/bookshelf/[id]/page.tsx`, `BookDetailClient.tsx` |
| 에러/로딩 처리 | `app/bookshelf/[id]/error.tsx`, `loading.tsx` |

---

## Phase 3 착수 전 필수 결정

### OD-001: 임베딩 모델 선택 (Blocker)

Phase 3 첫 번째 작업. 결정에 따라 `ARCHITECTURE.md`의 vector 차원 확정 + 스키마 마이그레이션 필요.

| 옵션 | 모델 | 차원 | 비용 |
|------|------|------|------|
| A | OpenAI text-embedding-3-small | 1536 | $0.02/1M tokens |
| B | Anthropic 임베딩 (향후 출시 시) | 1024 | 미정 |

**권장**: 현시점 OpenAI text-embedding-3-small이 안정적. 운섭 판단 후 결정.

---

## 다음 세션 작업 후보

### 옵션 A — Phase 3 바로 착수

1. OD-001 결정 (임베딩 모델)
2. `ARCHITECTURE.md` vector 차원 확정
3. 임베딩 생성 API (`lib/rag/embed.ts`)
4. 배치 임베딩 스크립트 (`scripts/embed-all.ts`)
5. RAG 검색 함수 (`lib/rag/search.ts`)

### 옵션 B — TD-002 테스트 인프라 선행

1. 운섭 승인: vitest + @testing-library/react 패키지 추가
2. 핵심 경로 단위 테스트 작성 (fetchBooks, API route, useBookshelf)
3. Phase 3 착수

---

## 기술 부채 현황

| ID | 내용 | 심각도 | 해결 예정 |
|----|------|--------|---------|
| TD-001 | 이미지 2건 Notion S3 fallback — 만료 위험 | Low | Phase 4 |
| TD-002 | 테스트 인프라 부재 (vitest 미설치) | Medium | 다음 작업 사이클 (운섭 승인 필요) |
| TD-003 | 함수 50줄 초과 3건 (가독성) | Low | Phase 4 |
| TD-004 | `formatReadPeriod` 함수 중복 (DRY 위반) | Low | Phase 4 |
| TD-005 | `/bookshelf` 루트 loading.tsx + error.tsx 미존재 | Low | 체감 후 판단 |

---

## 미결 의사결정

| ID | 내용 | 긴급도 |
|----|------|--------|
| OD-001 | 임베딩 모델 선택 | **Phase 3 Blocker** |
| OD-003 | 대화 이력 보존 기간 | Phase 3 완료 전 |

---

## 참고

- GitHub: `https://github.com/wslee423/book_memory.git`
- Supabase URL: `https://lubknrqpyyhtnbkoruhq.supabase.co`
- Storage bucket: `book-media` (public)
- 마이그레이션 재실행: `npm run migrate` (upsert — 중복 없음)

---

## 다음 세션 핸드오프

**현재 Phase**: Phase 2 완료, Phase 3 대기

**마지막 완료**: Phase 2 책장 MVP (목록/필터/검색/상세/네비게이션) + Vercel 배포

**다음 할 것**:
- 운섭이 옵션 A(Phase 3 바로) 또는 옵션 B(테스트 선행) 결정
- Phase 3 착수 시 → OD-001 임베딩 모델 결정이 첫 번째 작업

**세션 종료 시각**: 2026-05-17
