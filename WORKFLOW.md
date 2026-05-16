# WORKFLOW.md — book_memory 사람-에이전트 반복 실행 루프

> 모든 에이전트가 세션 시작/종료 시 이 문서를 따른다.
> Claude Code 세션 기반 환경 전제.

---

## 1. 세 가지 루프

| 레벨 | 루프 | 주기 |
|------|-----|------|
| **Level 1** | 세션 루프 | 1회 Claude Code 세션 |
| **Level 2** | 기능 루프 | 1개 기능 완성 |
| **Level 3** | Phase 루프 | 1개 Phase 완료 |

---

## 2. 세션 시작 루틴 (Level 1)

에이전트는 세션 시작 시 순서대로 수행한다.

1. `CONSTITUTION.md` 읽기 — 불변 원칙 확인
2. `CLAUDE.md` 읽기 — 스택·규칙 확인
3. `docs/exec/NEXT_SESSION.md` 확인 — 이전 세션 핸드오프
4. `PLANS.md` 현재 Phase + `docs/exec/open-decisions.md` 미결 항목 확인
5. 사람에게 한 줄 확인:
   > "오늘 작업: [추정 작업]. 맞으면 진행, 아니면 방향 알려주세요."

예외: 사람이 명확한 지시로 시작한 경우 → 5 생략.

---

## 3. 기능 크기 분류

### 작은 기능 (Small)

아래 **3가지 모두** 해당:
- Supabase 스키마 변경 없음 (테이블/컬럼/RLS)
- 외부 패키지 추가 없음
- CONSTITUTION 불변 원칙과 관련 없음

→ **에이전트 자체 완료 가능.**

### 큰 기능 (Large)

위 중 **하나라도** 해당 안 됨 **또는** 판단 불명확.

→ **사람 최종 승인 필요.** (불확실하면 큰 기능으로 간주)

book_memory 예시:
- Small: UI 컴포넌트 수정, 필터 조건 추가, 텍스트 변경
- Large: DB 스키마 변경, RAG 파이프라인 추가, 마이그레이션 스크립트 실행

---

## 4. 기능 루프 (Level 2)

### 4-1. 작은 기능 흐름

```
[사람] 방향 결정
  → [Orchestrator] 크기 판단: Small + 직접 구현
  → [Reviewer subagent] 검증 (실패 시 3회 재시도)
  → [Orchestrator] /sync-docs + 커밋
  → [Orchestrator] 사후 보고
```

### 4-2. 큰 기능 흐름

```
[사람] 방향 결정
  → [Orchestrator] 크기 판단: Large + /orchestrate 실행
  → [Implementer subagent] 구현 (ARCHITECTURE.md 구현 순서 준수)
  → [Reviewer subagent] 검증 (실패 시 3회 재시도 → 에스컬레이션)
  → [Orchestrator] Reviewer PASS 보고 + 사람 승인 대기
  → [사람] 최종 승인
  → [Documenter subagent] 문서 업데이트 + 커밋
```

### 4-3. 작업 중 크기가 바뀐 경우

작은 기능으로 시작했는데 중간에 스키마 변경, 외부 패키지 필요 등이 발생하면
**즉시 멈추고 에스컬레이션**.

---

## 5. 사람의 개입 시점

| 상황 | 사람 개입 필요? |
|------|--------------|
| 세션 시작 | ✅ |
| 작은 기능 전체 | ❌ |
| 큰 기능 시작 전 불명확함 | ✅ |
| 큰 기능 검증 후 최종 승인 | ✅ |
| Supabase 스키마 변경 | ✅ |
| 외부 패키지 추가 | ✅ |
| 마이그레이션 스크립트 실행 | ✅ |
| RAG 시스템 프롬프트 변경 | ✅ |
| 에스컬레이션 발생 | ✅ |
| CONSTITUTION 개정 | ✅ (사람만 가능) |
| typecheck/lint 에러 자체 수정 | ❌ |
| tech-debt 자동 등록 | ❌ |
| 세션 종료 시 | ✅ |

---

## 6. 에스컬레이션 조건

에이전트는 아래 상황에서 **즉시 멈추고** 사람에게 보고한다.
상세: `.claude/shared/ESCALATION_BLOCK.md`

- 두 선택지가 동등하게 합리적일 때
- CONSTITUTION 불변 원칙과 현실이 충돌할 때
- 작업 범위가 예상의 3배 이상 커질 것 같을 때
- Supabase 스키마 변경이 필요할 때
- 외부 패키지 추가가 필요할 때
- Notion 데이터 삭제/덮어쓰기 가능성이 있을 때
- 같은 오류로 3회 이상 재시도 실패했을 때
- `docs/exec/open-decisions.md`의 🔴 Blocker 항목을 만났을 때
- 작업 도중 "작은 기능"이 "큰 기능"으로 커진 것을 감지했을 때

---

## 7. 세션 종료 루틴 (Level 1)

에이전트는 작업 종료 시 반드시 수행:

1. `docs/exec/lessons.md` — 이번 세션 발견한 교훈 L1 기록 (있으면)
2. `PLANS.md` — 완료 항목 체크박스 업데이트
3. `docs/exec/open-decisions.md` — 새 항목 추가 / 결정된 항목 처리
4. `docs/exec/tech-debt.md` — 업데이트 (있으면)
5. `docs/exec/NEXT_SESSION.md` — 다음 세션 핸드오프 작성

### 핸드오프 메시지 형식

```markdown
## 🔖 다음 세션 핸드오프

**현재 Phase**: [Phase N]
**마지막 완료**: [기능명]
**다음 할 것**: [작업명 + 간략 설명]

**막힌 것**: (없으면 생략)
- [항목]: [이유]

**결정 필요**: (없으면 생략)
- [항목]: [선택지 A / B]

**세션 종료 시각**: YYYY-MM-DD HH:MM
```

---

## 8. Phase 루프 (Level 3)

### 진입 조건
- 이전 Phase 체크리스트 모두 완료
- 사람의 명시적 승인

### Phase Gate 체크 (완료 선언 전)
- `PLANS.md` 해당 Phase 전체 체크 완료
- `docs/exec/open-decisions.md` 해당 Phase 관련 항목 모두 처리
- `docs/exec/tech-debt.md` Phase 차단 항목 없음
- 사람에게 다음 Phase 진입 확인 요청

---

## 9. 비정상 종료 복구

세션이 비정상 종료된 경우:

1. `docs/exec/NEXT_SESSION.md` 확인
2. 없으면 `git log` 로 마지막 커밋 확인
3. `PLANS.md` 와 실제 구현 상태 대조
4. 사람에게 복구 상태 보고 후 재개
