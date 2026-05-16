# CLAUDE.md — book_memory 에이전트 운영 규칙

> 모든 Claude 세션이 시작할 때 자동 로드되는 컨텍스트.
> CONSTITUTION.md 하위. AGENTS.md 상위.

---

## 세션 시작 루틴 (필수)

```
1. CONSTITUTION.md 확인 — 불변 원칙 숙지
2. NEXT_SESSION.md 확인 — 이전 세션 인수인계
3. PLANS.md + open-decisions.md 확인 — 현재 Phase·미결 항목
4. 사람의 오늘 목표 확인
```

WORKFLOW.md §2에 상세 절차가 있다.

---

## 프로젝트 컨텍스트

| 항목 | 내용 |
|------|------|
| 프로젝트명 | book_memory |
| 목적 | 개인 AI 독서 비서 — 읽은 책·메모를 삶의 의사결정에 연결 |
| 사용자 | 운섭 (1인, 외부 공개 없음) |
| 현재 Phase | Phase 1 — 기반 세팅 |
| 데이터 소스 | Notion "나의 책장" DB → Supabase 마이그레이션 |

---

## 기술 스택 요약

| 역할 | 선택 |
|------|------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Styling | Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL + Auth + pgvector) |
| AI | Anthropic Claude API (RAG 비서) |
| 배포 | Vercel |

---

## 코드 작성 규칙

1. **TypeScript strict 모드** — `any` 타입 사용 금지
2. **에러 처리** — 빈 catch 금지, 모든 에러는 표준 응답으로 전파
3. **환경변수** — 시크릿은 `.env.local`에만, 코드에 하드코딩 절대 금지
4. **API Route** — 모든 Route에 인증 미들웨어 적용 필수
5. **UI 텍스트** — 한국어 전용 (CONSTITUTION 원칙 4)
6. **DB 접근** — UI 컴포넌트에서 직접 Supabase 접근 금지, API Layer 경유 필수

---

## 에스컬레이션 조건 (즉시 사람에게 보고)

- Supabase 스키마 변경 (테이블/컬럼 추가·삭제·수정)
- 외부 패키지 추가
- Notion 데이터 삭제/덮어쓰기 발생 가능 작업
- CONSTITUTION 불변 원칙과 충돌하는 구현 요청
- Reviewer 3회 FAIL

---

## 세션 종료 루틴

```
1. docs/exec/lessons.md — 이번 세션 교훈 L1 기록 (있으면)
2. /sync-docs 실행 — PLANS.md, NEXT_SESSION.md, tech-debt.md 갱신
3. /learn 후보 제시 — 교훈 승격 후보 있으면 보고 (실행하지 않음)
4. 다음 세션 목표 명시
```

WORKFLOW.md §7에 핸드오프 작성 형식이 있다.

---

## 참조 문서 맵

| 문서 | 용도 |
|------|------|
| `CONSTITUTION.md` | 불변 원칙 |
| `AGENTS.md` | 에이전트 역할·자율범위 |
| `PLANS.md` | Phase별 로드맵 |
| `ARCHITECTURE.md` | 기술 스택·구조 |
| `QUALITY_SCORE.md` | 품질 기준 |
| `docs/product-specs/bookshelf.md` | 책장 웹서비스 스펙 |
| `docs/product-specs/ai-mate.md` | AI 독서메이트 스펙 |
| `docs/product-specs/migration.md` | Notion 마이그레이션 스펙 |
| `docs/exec/NEXT_SESSION.md` | 세션 인수인계 |
| `docs/exec/tech-debt.md` | 기술 부채 |
| `docs/exec/open-decisions.md` | 미결 의사결정 |
