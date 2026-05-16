# NEXT_SESSION.md — 세션 인수인계

> 마지막 업데이트: 2026-05-16

---

## 현재 상태

| 항목 | 내용 |
|------|------|
| 현재 Phase | Phase 1 — 기반 세팅 (🔄 거의 완료) |
| 마지막 완료 작업 | Notion → Supabase 마이그레이션 실행 완료 (129책 / 1,277 pages / 94 images) |
| 다음 작업 | Vercel 배포 파이프라인 연결 → Phase 1 Gate 통과 |

---

## Phase 1 완료 조건 잔여 항목

- [ ] **Vercel 배포 파이프라인 연결** — 이것만 하면 Phase 1 완료

---

## Vercel 배포 방법 (다음 세션 작업)

1. Vercel 대시보드에서 New Project → book_memory GitHub repo 연결
2. Framework: Next.js 자동 감지
3. 환경변수 설정 (`.env.local` 값 그대로):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

---

## 미결 사항

- OD-001: 임베딩 모델 선택 (Phase 3 착수 전 필수)
- OD-002: Notion 표지 이미지 처리 → **현재: next.config.mjs 도메인 허용으로 처리 완료**
- TD-001: 이미지 2건 만료 위험 (Phase 4에서 처리)

---

## 완료된 데이터 현황

| 항목 | 수량 |
|------|------|
| books | 129개 |
| book_pages (텍스트) | 1,183개 |
| book_pages (이미지) | 94개 (Supabase Storage) |
| 이미지 fallback (만료 위험) | 2개 (TD-001) |

---

## 참고

- GitHub: `https://github.com/wslee423/book_memory.git`
- Supabase URL: `https://lubknrqpyyhtnbkoruhq.supabase.co`
- Storage bucket: `book-media` (public)
- 마이그레이션 재실행: `npm run migrate` (upsert이므로 중복 없음)

## 🔖 다음 세션 핸드오프

**현재 Phase**: Phase 1 — 기반 세팅 (Vercel 연결만 남음)
**마지막 완료**: 마이그레이션 전체 실행 (책 129개, 이미지 94개 Storage 업로드)
**다음 할 것**: Vercel 배포 연결 → Phase 1 Gate → Phase 2 착수

**세션 종료 시각**: 2026-05-16
