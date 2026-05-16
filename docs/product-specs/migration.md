# Notion 마이그레이션 스펙 — migration.md

---

## 개요

Notion "나의 책장" DB 전체를 Supabase로 이관한다.
Notion은 이관 후 읽기 전용 백업으로 유지 (CONSTITUTION 원칙 5).

---

## 소스 데이터

| 항목 | 내용 |
|------|------|
| Notion DB URL | `https://www.notion.so/24b181ea72884e11bec06720581c1792` |
| Data Source ID | `collection://0c501247-f877-4cbd-aed4-2f51832d968c` |
| 데이터 구성 | books 메타데이터 + 각 책의 페이지 내용 블록 |

---

## 마이그레이션 순서

```
1. 환경 확인 (Supabase 스키마 적용 완료 여부)
2. Notion API로 전체 페이지 목록 조회
3. 각 페이지별:
   a. 메타데이터 → books 테이블 insert
   b. 페이지 블록 내용 → book_pages 테이블 insert (content_type 분류)
4. 커버 이미지 URL 처리 (Notion 임시 URL → 보존 or 재다운로드)
5. 검증: books 수, book_pages 수 확인
6. 완료 보고
```

---

## 이미지 처리 전략

Notion 표지 이미지는 S3 임시 서명 URL이라 만료된다.
**Phase 1 MVP 전략**: URL만 저장, 만료 시 표지 없음으로 표시 (추후 개선)
**Phase 4 개선 예정**: 이미지 다운로드 → Supabase Storage 업로드

---

## 데이터 매핑

Notion 필드 → Supabase 컬럼 매핑 및 content_type 분류 규칙은 `docs/product-specs/bookshelf.md` §Notion 데이터 → DB 매핑을 단일 기준으로 사용한다.

두 문서가 달라지면 `bookshelf.md`가 우선한다.

---

## 검증 체크리스트

- [ ] 이관된 books 수 = Notion DB 페이지 수
- [ ] 각 book에 book_pages가 1개 이상 연결됨 (내용 있는 책만)
- [ ] notion_id가 모두 채워짐 (역추적 가능)
- [ ] rating 변환 정확 (★★★★★ → 5)
- [ ] keywords, one_word 배열 정확 이관

---

## 스크립트 위치

`scripts/migrate-notion.ts` — 1회성 터미널 직접 실행 스크립트.
API Route(`/api/migrate`)는 존재하지 않는다.

```bash
# 실행 방법 (Next.js 환경)
npx tsx scripts/migrate-notion.ts
```

---

## 실패 처리

- 개별 페이지 실패 시: 에러 로그 기록 후 다음 페이지 계속 진행 (중단 없음)
- 전체 실패 시: Supabase 데이터 롤백 (truncate 후 재시도)
- 완료 후 Notion 원본은 절대 삭제하지 않음
