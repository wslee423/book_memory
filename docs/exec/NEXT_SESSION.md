# NEXT_SESSION.md — 세션 인수인계

> 마지막 업데이트: 2026-05-16

---

## 현재 상태

| 항목 | 내용 |
|------|------|
| 현재 Phase | Phase 1 — 기반 세팅 (🔄 진행 중) |
| 마지막 완료 작업 | Next.js 14 초기화 + 기반 코드 작성 (typecheck/lint 0건) |
| 다음 작업 | Supabase 스키마 실행 + 마이그레이션 스크립트 Notion 필드 매핑 구현 |

---

## 운섭이 직접 해야 하는 것 (다음 세션 전)

1. **Supabase 대시보드에서 SQL 실행** (순서 중요):
   ```
   1단계: scripts/schema.sql 실행
   2단계: scripts/rls.sql 실행
   ```
   - 기존 Supabase 프로젝트의 SQL Editor에서 실행
   - `book_memory` 스키마로 분리됨

2. **.env.local 파일 작성**:
   ```
   .env.local.example 참고하여 D:\wlabs\book_memory\.env.local 생성
   ```

3. **Notion API Key 발급** (없으면):
   - https://www.notion.so/my-integrations 에서 통합 생성
   - 나의 책장 DB에 통합 연결

---

## 다음 세션 시작 시 해야 할 일

1. 운섭이 스키마 실행 + .env.local 작성 완료 확인
2. `docs/product-specs/bookshelf.md` 열어서 Notion 필드 매핑 확인
3. Notion API로 실제 DB 필드 구조 조회 (migrate-notion.ts 실행 테스트)
4. `scripts/migrate-notion.ts` Notion 필드 → books/book_pages 매핑 구현
5. 마이그레이션 실행 + 검증 (운섭 승인 후)
6. Vercel 배포 연결

---

## 미결 사항

- 임베딩 모델 선택 (OD-001) — Phase 3 전에 결정. `scripts/schema-embeddings.sql` 실행 대기
- Notion 이미지 만료 문제 처리 방안 (OD-002) — Phase 2 완료 전 결정 필요

---

## 참고

- Notion DB URL: `https://www.notion.so/24b181ea72884e11bec06720581c1792`
- Notion Data Source ID: `collection://0c501247-f877-4cbd-aed4-2f51832d968c`
- GitHub: `https://github.com/wslee423/book_memory.git`
- Supabase 스키마명: `book_memory` (기존 프로젝트에 스키마 분리)
- 마이그레이션 실행: `npm run migrate` (터미널 직접 실행, API Route 없음)

## 🔖 다음 세션 핸드오프

**현재 Phase**: Phase 1 — 기반 세팅 (진행 중)
**마지막 완료**: Next.js 14 초기화, TypeScript 타입, Supabase 클라이언트, Notion 클라이언트, 마이그레이션 스크립트 skeleton, SQL 파일 작성
**다음 할 것**: 스키마 SQL 실행 확인 + 마이그레이션 스크립트 Notion 필드 매핑 완성

**막힌 것**:
- 마이그레이션 스크립트: Notion 실제 필드 구조를 API로 조회해야 매핑 구현 가능 → 운섭이 .env.local 설정 후 진행

**결정 필요**:
- OD-001: 임베딩 모델 선택 (OpenAI 1536차원 / Anthropic 1024차원) — Phase 3 전 필수

**세션 종료 시각**: 2026-05-16
