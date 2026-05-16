# NEXT_SESSION.md — 세션 인수인계

> 마지막 업데이트: 2026-05-16

---

## 현재 상태

| 항목 | 내용 |
|------|------|
| 현재 Phase | Phase 1 — 기반 세팅 (🔲 미시작) |
| 마지막 완료 작업 | 프로젝트 기획 + 문서 세트 초안 작성 |
| 다음 작업 | Next.js 프로젝트 초기화 |

---

## 다음 세션 시작 시 해야 할 일

1. `PLANS.md` Phase 1 작업 목록 확인
2. Next.js 14 프로젝트 초기화
   ```bash
   npx create-next-app@latest book-memory --typescript --tailwind --app --no-src-dir
   ```
3. Supabase 프로젝트 생성 (대시보드에서 수동)
4. 환경변수 설정 (.env.local)
5. `ARCHITECTURE.md`의 DB 스키마 SQL 실행

---

## 미결 사항

- 임베딩 모델 선택 (OpenAI vs Anthropic) — Phase 3 전에 결정
- Notion 이미지 만료 문제 처리 방안 (Phase 4 예정이나 일찍 결정 필요 가능)

---

## 참고

- Notion DB Data Source ID: `collection://0c501247-f877-4cbd-aed4-2f51832d968c`
- Notion 책 데이터: 각 페이지에 하이라이트·메모·AI 대화·일기 혼재
- AI 독서메이트 URL 필드에 기존 Gemini 대화 링크 있음 (보존 필요)
