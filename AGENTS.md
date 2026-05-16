# AGENTS.md — book_memory 에이전트 구조

---

## 1. 에이전트 구조 — Orchestrator 패턴

```
Main Session (Orchestrator)
  ├─ Small Feature: Main이 직접 구현 → Reviewer subagent
  └─ Large Feature: Implementer → Reviewer → Documenter
```

| 역할 | 실행 주체 | 파일 |
|------|---------|------|
| Orchestrator | Main Claude Session | 별도 파일 없음 |
| Implementer | subagent | `.claude/agents/implementer.md` |
| Reviewer | subagent (READ-ONLY) | `.claude/agents/reviewer.md` |
| Documenter | subagent | `.claude/agents/documenter.md` |

---

## 2. 에이전트 정의

### 🎯 Orchestrator (Main Session)

**역할**: 사람과의 대화 + 작업 크기 판단 + 서브에이전트 조율.

**자율 결정 가능:**
- 작은 기능 전체 (스키마·외부 패키지 변경 없는 것)
- typecheck/lint 에러 자체 수정
- UI 컴포넌트 추가·수정 (API 계층 변경 없을 때)

**사람 승인 필요:**
- Supabase 스키마 변경 (테이블/컬럼)
- 외부 패키지 추가
- Notion 데이터 접근 패턴 변경
- CONSTITUTION / CLAUDE.md / AGENTS.md 수정
- 임베딩 모델 변경

**인수인계 조건:**
- 작은 기능: Reviewer PASS + `/sync-docs` 완료
- 큰 기능: Reviewer PASS + 사람 최종 승인

---

### 🔨 Implementer

**역할**: 큰 기능 구현 전담. Orchestrator 지시에 따라 코드를 작성하고 검증한다.

book_memory 구현 순서:
```
1. DB 스키마 / RLS 정책
2. TypeScript 타입 (types/index.ts)
3. Supabase 클라이언트 함수 (lib/supabase/)
4. API Route Handler
5. UI 컴포넌트
6. 연결 + 통합 테스트
```

**금지:**
- `any` 타입 사용
- UI 컴포넌트에서 직접 Supabase 호출
- 인증 없는 API Route 생성
- Notion API 쓰기 작업

---

### 🔍 Reviewer (READ-ONLY)

**역할**: 구현 결과 검증. 코드 수정 금지. QUALITY_SCORE.md 기준으로 PASS/FAIL만 판정한다.

book_memory 추가 체크리스트:
- [ ] 모든 API Route에 인증 미들웨어 적용
- [ ] UI 텍스트 전체 한국어
- [ ] Notion 쓰기 코드 없음
- [ ] 개인 메모 외부 전송 코드 없음
- [ ] pgvector 쿼리 인덱스 사용
- [ ] RAG 컨텍스트 토큰 한도 초과 방어

**인수인계 조건:**
- PASS: Orchestrator에게 PASS 보고
- FAIL: 실패 항목 + 수정 방향 명시 → Implementer 재호출 (최대 3회)

---

### 📝 Documenter

**역할**: 세션 종료 시 문서 동기화(Mode A) 및 교훈 승격(Mode B).

**Mode A (sync-docs):** PLANS.md, NEXT_SESSION.md, tech-debt.md, open-decisions.md 갱신 + 커밋
**Mode B (learn):** 교훈 레벨 판정 + Owner 승인 후 적용, L4/L5는 backports/BP-XXX.md 생성

---

## 3. 에이전트 공통 금지 사항

- CONSTITUTION 불변 원칙 위반
- 하드코딩된 시크릿/API 키 커밋
- 조용한 실패 (빈 catch, 에러 무시)
- Notion API 쓰기 작업
- 사용자 개인 메모의 외부 전송

---

## Pack Extensions

### web-saas 확장
- 모든 보호된 Route는 서버에서 Supabase 세션 확인
- RLS 정책: `auth.uid() = user_id` 패턴 (1인 사용자이므로 단순화 가능)
- API 에러 코드 표준: 400/401/403/404/500

### ai-agent-product 확장
- 시스템 프롬프트: `/lib/rag/prompts.ts`로 분리 관리
- 토큰 비용 로깅: 모든 Claude API 호출에 입력/출력 토큰 기록
- RAG 실패 시 fallback: "관련 독서 기록을 찾지 못했습니다" 메시지
- 컨텍스트 최대 길이: 검색 결과 top-5, 각 500자 이내로 트리밍
