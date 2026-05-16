# /review — 코드 검증 단독 실행

> reviewer subagent를 단독으로 호출한다.
> `/orchestrate` 흐름의 일부로도 호출되지만, 이미 구현된 PR/브랜치를 사후 검증할 때 단독 사용.

---

## 입력

```
/review [범위?]
```

- 범위 미지정: `HEAD~1..HEAD` (마지막 커밋)
- 범위 지정 예: `HEAD~3..HEAD`, `feat-x..main`

---

## 절차

Main Session이 수행:

1. 입력 범위 파악 (기본값 또는 인자)
2. `Agent(subagent_type="reviewer")` 호출
3. 전달:
   - 변경 범위 (git diff 범위 또는 파일 경로 목록)
   - `QUALITY_SCORE.md` 경로
   - 관련 `product-spec` 경로 (있으면)
4. reviewer 보고 수신 후 그대로 출력

---

## 절대 전달하지 않는 것

- 구현 의도 / reasoning
- 작업 배경 설명
- "이번 PR은 급해서 일부 기준은 넘어가도 돼" 같은 컨텍스트

reviewer는 의도와 무관하게 QUALITY_SCORE.md 기준만 본다.

---

## 출력

reviewer subagent의 PASS/FAIL 보고 (`.claude/agents/reviewer.md` 참조).

FAIL인 경우 "권장 수정" 항목을 확인 후 직접 수정 또는 `/orchestrate` 재실행.
