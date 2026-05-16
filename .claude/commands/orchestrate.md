# /orchestrate — 기능 구현 전체 흐름

> 이 슬래시 명령은 **Main Claude Session이 직접 수행**한다.
> Orchestrator는 별도 subagent가 아니라 Main Session의 역할이다.
> Implementer / Reviewer / Documenter는 `Agent(subagent_type="...")` 도구로 spawn되는 subagent다.

---

## 입력

```
/orchestrate [기능명 또는 작업 설명]
```

---

## 1. 컨텍스트 파악 (Main Session 직접 수행)

```
- CONSTITUTION.md 확인
- PLANS.md에서 해당 기능 위치 확인
- docs/product-specs/[기능].md 분석
- docs/exec/open-decisions.md에서 🔴 Blocker 없는지 확인
```

---

## 2. 기능 크기 판단

`WORKFLOW.md` §3 기준 적용.

**Small** — 아래 3가지 모두 해당:
- 데이터 스키마 변경 없음
- 외부 API 신규 연동 없음
- CONSTITUTION 불변 원칙과 무관

**Large** — 위 중 하나라도 해당:
- DB / API 스키마 변경
- 패키지 신규 추가
- AI 프롬프트 핵심 변경
- 4개 이상 파일 수정 예상

> 프로젝트 타입별 추가 기준은 `AGENTS.md` §Pack Extensions 참조 (Pack 적용 시 해당 섹션에 누적됨).

---

## 3. 분기 실행

### 3-A. Small 흐름

Main Session이 직접 구현 → reviewer subagent 호출.

```
1. Main이 직접 구현 + 자체 typecheck/lint 통과
2. Agent(subagent_type="reviewer") 호출
   전달: 변경 파일 경로, QUALITY_SCORE.md 경로, product-spec 경로
   절대 전달 금지: 구현 reasoning, 의도 설명
3. PASS → /sync-docs 실행
   FAIL → reviewer의 "권장 수정"대로 Main이 수정 후 재호출 (최대 3회)
```

### 3-B. Large 흐름

implementer → reviewer → **사람 승인** → documenter 순서.

```
1. Agent(subagent_type="implementer") 호출
   전달: 기능명, 스펙 경로, 규칙 파일 경로, 구현 시퀀스
2. implementer 완료 보고 수신
3. Agent(subagent_type="reviewer") 호출
   전달: 변경 파일 경로, QUALITY_SCORE.md, product-spec
   ★ implementer의 reasoning은 절대 전달하지 않는다 (변경 파일 목록만)
4. PASS → 단계 5
   FAIL → reviewer의 "권장 수정"을 implementer에게 그대로 전달 + 재호출 (최대 3회)
5. 사람 승인 요청 — 아래 형식으로 보고:
   ```
   ## ✅ Reviewer PASS — 사람 승인 필요

   변경 파일: [목록]
   Reviewer 결과: PASS
   다음: 승인하시면 documenter(문서 동기화 + 커밋)를 실행합니다.
   ```
6. 사람 승인 수신 → Agent(subagent_type="documenter") 호출 (Mode A)
7. 완료 보고
```

---

## 4. Reviewer 호출 포맷 — 고정 템플릿 필수

reviewer subagent 호출 시 **반드시 아래 포맷만 사용**한다.
이 포맷 외의 자유 텍스트는 `.claude/hooks/validate-reviewer-call.js`가 탐지하여 **호출 자체를 차단**한다.

```
DIFF_RANGE: <예: HEAD~1..HEAD>
QUALITY_SCORE_PATH: <예: QUALITY_SCORE.md>
PRODUCT_SPEC_PATH: <예: docs/product-specs/feat-x.md 또는 NONE>
CHANGED_FILES:
  - path/to/file1
  - path/to/file2
```

재시도 시 (reviewer가 FAIL을 낸 경우)에만 아래 필드 추가 허용:
```
PREVIOUS_FAIL_REPORT: |
  [이전 reviewer FAIL 보고 내용 그대로 붙여넣기]
```

**절대 포함 금지 — hook이 차단함:**
- "이 변경의 의도는...", "왜 이렇게 했냐면..."
- implementer의 자율 결정 설명
- 구현 과정의 reasoning, 배경 설명

---

## 5. 재시도 정책

| 실패 단계 | 조치 |
|----------|------|
| Implementer 1~2회 실패 | 실패 내용 전달 후 재호출 |
| Reviewer FAIL 1~2회 | 권장 수정을 implementer에게 전달 후 재호출 |
| 3회 연속 실패 | 에스컬레이션 (`.claude/shared/ESCALATION_BLOCK.md` 형식 사용) |

---

## 6. 완료 보고

```
## ✅ [기능명] 완료

- Implementer: 구현 완료 (재시도 [N]회)
- Reviewer: 검증 통과
- 사람 승인: ✅ (Large Feature)  ← Small이면 이 줄 생략
- Documenter: 문서 동기화 + 커밋 완료
- /learn 후보: [N개 제시됨 / 없음]

다음 작업: PLANS.md 확인
```
