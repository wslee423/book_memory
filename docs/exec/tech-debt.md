# tech-debt.md — 기술 부채

> 현재 없음. Phase 진행하며 발견 시 추가.

| ID | 내용 | 심각도 | 발생 Phase | 해결 예정 |
|----|------|--------|-----------|---------|
| TD-001 | 마이그레이션 이미지 2건 Notion S3 fallback 저장됨 ("경제 읽어주는 남자의 15분 경제특강") — 원본 URL 만료 시 이미지 깨짐 | Low | Phase 1 | Phase 4 (Storage 재업로드) |
| TD-002 | 테스트 인프라 부재 — vitest/@testing-library/react 등 패키지 미설치. QUALITY_SCORE.md §3 (로직/상태반응성/통합 테스트) 위반 상태. Phase 2 Reviewer FAIL #4 항목 | Medium | Phase 2 | 다음 작업 사이클 (운섭 승인 후 패키지 추가 + 핵심 경로 테스트 작성) |
| TD-003 | `useBookshelf` 71줄, `BookFilter` 112줄, `BookDetailMeta` 함수 분리 잔여. QUALITY_SCORE.md §2-3 가독성. BookDetailMeta는 Refactor 라운드에서 부분 분리됨 | Low | Phase 2 | Phase 4 |
| TD-004 | ~~`formatReadPeriod` 함수 중복~~ — Refactor 라운드에서 `lib/utils/format.ts`로 단일화 완료 (해결됨) | ✅ Resolved | Phase 2 | 2026-05-17 |
| TD-005 | `/bookshelf` 루트 loading.tsx + error.tsx 미존재 — SSR fetch 3건 동안 빈 화면 가능. `/bookshelf/[id]`에는 추가됨 | Low | Phase 2 | 실사용 후 체감 필요 시 추가 |
| TD-006 | `fetchAdjacentBooks` 전체 books fetch 후 메모리 findIndex — 130권에서는 무해하지만 데이터 증가 시 비효율. SQL window function(lag/lead) 또는 2-쿼리(`.lt().limit(1)` + `.gt().limit(1)`)로 대체 가능 | Low | Phase 2 | 데이터 증가 시 |
| TD-007 | `fetchBookStats` / `fetchAllKeywords` 전체 fetch 후 클라이언트 집계 — RPC 함수(count, unnest+distinct)로 이관 가능. 130권에서는 무해 | Low | Phase 2 | 데이터 증가 시 |
| TD-008 | `BookGallery`의 `next/image`에 `sizes` prop 누락 — 반응형 grid에서 srcset 후보 결정 비효율. `fill` + `sizes` 조합 또는 상단 책 일부에 `priority` 추가 검토 | Low | Phase 2 | Phase 4 UX 라운드 |
| TD-009 | search ILIKE 풀스캔 (leading wildcard `%search%`) — 인덱스 사용 불가. 데이터 증가 시 `pg_trgm` GIN 인덱스 또는 `tsvector` 도입 검토 | Low | Phase 2 | Phase 3 RAG 강화 시 |
| TD-010 | `BookPageItem`의 책 페이지 이미지는 일반 `<img>` 사용 (Supabase Storage 도메인). `next/image` 도메인 화이트리스트(`next.config.mjs`)에 Supabase Storage URL 등록 후 `next/image`로 전환 가능 | Low | Phase 2 | 표지 외 페이지 이미지 활용도 따라 결정 |
| TD-011 | DB CHECK 제약(`book_pages.content_type`)은 4종(`highlight`/`memo`/`ai_chat`/`diary`)만 허용하지만, 마이그레이션은 `image` 타입으로 94건 insert 성공. 스키마/실제 데이터/TS 타입(`ContentType`) 정합성 확인 필요. 마이그레이션 단계에서 CHECK 제약을 수정했을 가능성. | Low | Phase 2 | 다음 마이그레이션/스키마 변경 시 함께 |
| TD-012 | `scripts/embed-all.ts` Rate Limit 대응이 딜레이 하드코딩(image 800ms / text 50ms) — exponential backoff 없음. API 부하 증가 시 실패 위험 | Low | Phase 3 | Phase 5 재임베딩 전 |
| TD-013 | `scripts/embed-all.ts` N+1 쿼리 패턴 — 책마다 book_pages 개별 조회. 전체 배치 실행 시 쿼리 수 = 책 수. IN 절 또는 조인 쿼리로 개선 가능 | Low | Phase 3 | Phase 5 재임베딩 전 |
| TD-014 | `app/stats/page.tsx`, `app/timeline/page.tsx`가 API route와 동일한 DB 집계 로직 중복 — Server Component에서 직접 Supabase 쿼리 vs API route 이중 구현 상태 | Low | Phase 4 | Phase 5 리팩터링 |
| TD-015 | `Book.status`가 `string \| null` — enum 타입 없음. 타입 안전 비교 불가 (`=== 'reading'` 등 리터럴 비교 전체에 영향). `'reading' \| 'completed' \| 'paused' \| null` union 타입 또는 const enum 도입 필요 | Medium | Phase 4 | Phase 5 타입 강화 |
