# /build-stage — 스테이지 생성 (현재 placeholder)

> 게임 프로젝트의 스테이지 생성 단독 슬래시 명령은 **현재 정의되지 않았다.**
> 이 파일은 향후 확장을 위한 자리 표시자다.

---

## 현재 처리 방식

스테이지 생성/수정은 **Implementer subagent**가 일반 구현 작업의 일부로 수행한다.

```
/orchestrate "스테이지 N 생성"
→ Orchestrator가 스테이지 파이프라인으로 분류
→ Implementer 호출 (스테이지 데이터 생성 + 자체 검증)
→ Reviewer 호출 (QUALITY_SCORE.md Pack Extensions §스테이지 검증 기준 적용)
```

---

## 향후 분리 검토 시점

다음 조건이 충족되면 별도 Stage Builder subagent + `/build-stage` 명령으로 분리 검토:

- 스테이지 생성 작업이 전체 작업의 30% 이상을 차지
- 스테이지 생성에 필요한 도구/규칙이 일반 구현과 명확히 다름
- 스테이지 전용 자동 검증 루프가 별도 가치를 가짐

분리 시 추가될 파일:
- `agent_runtime/agents/stage-builder.md`
- 이 파일 내용 교체 (실제 slash command 정의로)
