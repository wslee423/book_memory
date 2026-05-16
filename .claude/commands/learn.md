# /learn — 교훈 승격 (수동 트리거)

> documenter subagent를 Mode B로 호출한다.
> `core/LESSON_LIFECYCLE.md`의 5단계 승격 doctrine을 실행한다.

---

## 입력

```
/learn "<문제 설명>"
```

예시:
```
/learn "Reviewer가 select('*') 사용을 두 번째 잡았는데 implementer가 같은 실수를 반복함"
/learn "soft delete 누락이 production에서 발견됨"
/learn "AI 에이전트가 투자 조언처럼 보이는 답변을 면책 문구 없이 했음"
```

---

## 절차

Main Session이 수행:

1. `Agent(subagent_type="documenter")` 호출
2. 전달:
   - "Mode B — /learn" 명시
   - 입력받은 문제 설명
   - LESSON_LIFECYCLE.md doctrine (documenter Mode B에 내장됨)
   - 현재 프로젝트의 문서 경로:
     - `docs/exec/lessons.md`
     - `QUALITY_SCORE.md`
     - `.claude/agents/` 디렉토리
     - `.claude/commands/` 디렉토리
3. documenter가 레벨 판정 + 변경 계획 작성 + **Owner 승인 대기**
4. Owner 승인 후 documenter가 변경 적용
5. L4/L5인 경우 `docs/exec/backports/BP-XXX.md` 자동 생성

---

## Owner의 역할

- documenter가 제시한 계획을 검토
- 승인 / 수정 / 거부 응답
- L4/L5의 `docs/exec/backports/BP-XXX.md`를 ai_engineering_docs 본체에 적용할지 별도 결정 (자동 적용 안 됨)

---

## 절대 일어나면 안 되는 것

- documenter가 Owner 승인 없이 파일 수정
- L4/L5 변경이 ai_engineering_docs 본체에 자동 반영
  (반드시: BP-XXX.md 생성 → Owner 수동 승인 → 본체 수정 순서)
- LESSON_LIFECYCLE.md 승격 기준을 벗어난 레벨 부여
