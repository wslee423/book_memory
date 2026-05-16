# /sync-docs — 문서 동기화 + 커밋 + /learn 후보 제시

> documenter subagent를 Mode A로 호출한다.
> 기능 완료 후 세션 종료 전에 실행.

---

## 입력

```
/sync-docs
```

인자 없음. 최근 git 변경을 기준으로 작동.

---

## 절차

Main Session이 수행:

1. `Agent(subagent_type="documenter")` 호출
2. 전달:
   - "Mode A — sync-docs" 명시
   - 최근 git diff 범위 (기본 `HEAD~1`)
   - 프로젝트 문서 경로 (`PLANS.md`, `docs/exec/*` 등)
3. documenter가 다음 수행:
   - PLANS.md / NEXT_SESSION.md / tech-debt / open-decisions 갱신
   - git commit
   - **/learn 후보 1~3개 제시 (실행하지 않음)**
4. 결과 보고 출력

---

## 출력

documenter subagent의 Mode A 보고 (`.claude/agents/documenter.md` 참조).

/learn 후보가 제시되면, Owner는 원하는 것을 골라서 별도로 `/learn "<문제>"` 실행.
