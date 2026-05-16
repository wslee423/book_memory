# tech-debt.md — 기술 부채

> 현재 없음. Phase 진행하며 발견 시 추가.

| ID | 내용 | 심각도 | 발생 Phase | 해결 예정 |
|----|------|--------|-----------|---------|
| TD-001 | 마이그레이션 이미지 2건 Notion S3 fallback 저장됨 ("경제 읽어주는 남자의 15분 경제특강") — 원본 URL 만료 시 이미지 깨짐 | Low | Phase 1 | Phase 4 (Storage 재업로드) |
| TD-002 | 테스트 인프라 부재 — vitest/@testing-library/react 등 패키지 미설치. QUALITY_SCORE.md §3 (로직/상태반응성/통합 테스트) 위반 상태. Phase 2 Reviewer FAIL #4 항목 | Medium | Phase 2 | 다음 작업 사이클 (운섭 승인 후 패키지 추가 + 핵심 경로 테스트 작성) |
| TD-003 | 함수 50줄 초과 3건 — `useBookshelf` 71줄(BookshelfClient.tsx), `BookDetailMeta` 75줄(BookDetailClient.tsx), `BookFilter` 112줄(BookFilter.tsx). QUALITY_SCORE.md §2-3 위반. 가독성 영역 | Low | Phase 2 | Phase 4 UX 개선 라운드에서 함께 정리 |
| TD-004 | `formatReadPeriod` 함수 중복 — BookTable.tsx + BookDetailClient.tsx 동일 정의. DRY 위반. `lib/utils/format.ts`로 단일화 필요 | Low | Phase 2 | Phase 4 |
| TD-005 | `/bookshelf` 루트 loading.tsx + error.tsx 미존재 — SSR fetch 3건(fetchBooks + fetchBookStats + fetchAllKeywords) 동안 빈 화면 가능. `/bookshelf/[id]`에는 추가됨 | Low | Phase 2 | 실사용 후 체감 필요 시 추가 |
