# QUALITY_SCORE.md — book_memory 품질 기준

> Reviewer subagent가 매 기능 완료 시 이 파일 기준으로 검증한다.
> BASE + web-saas EXT + ai-agent-product EXT 병합본.

---

## 1. 사용법

기능 완료 시 §7 검증 체크리스트를 순서대로 실행한다.
PASS 조건: 모든 항목 통과. 하나라도 FAIL이면 Implementer 재호출.

---

## 2. 코드 품질

### 2-1. 정적 분석 (경고 0건) `[자동검증 가능]`

| 항목 | 기준 |
|------|------|
| 타입 오류 | 0건 |
| 린터 경고 | 0건 |
| 미사용 import/변수 | 0건 |
| 코드 포맷 | 100% 준수 |

```bash
# 프로젝트 검증 명령
npm run typecheck && npm run lint
```

### 2-2. 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 타입/인터페이스 | PascalCase | `BookRecord`, `ChatMessage` |
| 변수/함수 | camelCase | `fetchBooks()`, `bookId` |
| 상수 | UPPER_SNAKE_CASE | `MAX_CHUNK_SIZE` |
| 파일명 | kebab-case | `book-detail.tsx`, `rag-search.ts` |

### 2-3. 파일/함수 크기 `[자동검증 가능]`

| 항목 | 기준 | 초과 시 |
|------|------|--------|
| 단일 파일 | 300줄 이하 | 파일 분리 |
| 단일 함수 | 50줄 이하 | 함수 분리 |

예외: 자동 생성 파일, 타입 선언 전용 파일, SQL 마이그레이션 파일.

### 2-4. 타입 안정성

- TypeScript `strict` 모드 필수
- `any` 타입 사용 절대 금지
- 공용 타입은 `types/index.ts`에 집중

---

## 3. 테스트

### 3-1. 테스트 유형 분류

UI가 있는 기능은 아래 3가지 모두 존재해야 한다.

| 유형 | 대상 | 검증 내용 |
|------|------|----------|
| **로직** | 순수 함수, RAG 파이프라인, 데이터 변환 | 값 계산, 비즈니스 로직 |
| **상태 반응성** | 필터/검색 상태 → UI 연결 | 상태 변경 시 UI 리렌더 여부 |
| **통합** | API Route → DB → UI end-to-end | 전체 흐름 |

### 3-2. 테스트 커버리지

| 대상 | 기준 |
|------|------|
| RAG 파이프라인 (임베딩·검색·프롬프트) | 70% 이상 |
| API Route 핵심 경로 + 에러 케이스 | 포함 필수 |
| 인증/인가 로직 | 100% |
| UI 비동기 상태 | 상태 반응성 테스트 1개 이상 |

---

## 4. 에러 처리

### 4-1. 핵심 원칙: 조용한 실패 금지

모든 실패는 아래 중 하나로 처리:
1. 사용자에게 한국어 에러 메시지 표시
2. 로그 기록 + 재시도 수단 제공
3. 의도적 무시인 경우 주석으로 명시

```ts
// ❌ 금지
try { ... } catch(e) {}
fetch(url).catch(() => {})

// ✅ 허용
try { ... } catch(e) {
  console.error('[book_memory]', e)
  return { error: '데이터를 불러오지 못했습니다.' }
}
```

### 4-2. 외부 의존성 호출 기준

| 대상 | 타임아웃 | 재시도 | Fallback |
|------|---------|--------|---------|
| Supabase DB 쿼리 | 10초 | 1회 | "잠시 후 다시 시도해주세요" |
| Claude API (RAG) | 30초 | 1회 | "AI 응답을 받지 못했습니다" |
| 임베딩 API | 15초 | 2회 | 임베딩 생성 건너뜀 + 로그 |
| Notion API (마이그레이션) | 10초 | 3회 | 해당 페이지 스킵 + 오류 로그 |

### 4-3. 에러 등급

| 등급 | 설명 | 대응 |
|------|------|------|
| Critical | 데이터 손실, 크래시 | 즉시 수정 |
| High | 책장/AI메이트 기능 불가 | 같은 세션 내 수정 |
| Medium | UX 저하, 간헐 오류 | 현재 Phase 내 수정 |
| Low | 미세 UI 이슈 | tech-debt 등록 |

---

## 5. UI 상태 머신

비동기 작업(책 목록 로딩, AI 응답, 검색)을 표시하는 모든 UI는 **3가지 상태가 모두 도달 가능**해야 한다.

| 상태 | UI | 조건 |
|------|-----|------|
| Loading | 스켈레톤 카드 / 스피너 | 데이터 로딩 중 |
| Success | 결과 표시 | 완료 |
| Error | 한국어 에러 메시지 + 재시도 버튼 | 실패 |

```tsx
// ✅ book_memory 패턴
if (error) return <ErrorMessage message="책 목록을 불러오지 못했습니다." onRetry={refetch} />
if (!data) return <BookSkeleton />
return <BookList books={data} />
```

---

## 6. 문서 품질

### 6-1. 필수 문서 체크리스트

- [x] `CONSTITUTION.md`
- [x] `CLAUDE.md`
- [x] `AGENTS.md`
- [x] `QUALITY_SCORE.md`
- [x] `WORKFLOW.md`
- [x] `ARCHITECTURE.md`
- [x] `PLANS.md`
- [ ] `README.md`
- [x] `docs/exec/open-decisions.md`
- [x] `docs/exec/tech-debt.md`
- [x] `docs/exec/NEXT_SESSION.md`
- [x] `docs/exec/lessons.md`

### 6-2. 문서 작성 규칙

- 한국어 우선, 기술 용어는 영문 허용
- UI 텍스트는 반드시 한국어 (CONSTITUTION 원칙 4)
- 코드 블록에 언어 태그 명시

---

## 7. 검증 체크리스트 (기능 완료 시)

```
Step 1: 정적 분석
  □ npm run typecheck — 경고 0건
  □ npm run lint — 경고 0건

Step 2: 테스트
  □ 로직 테스트 통과
  □ UI 상태 반응성 테스트 존재 및 통과
  □ 통합 테스트 통과

Step 3: 에러 처리
  □ 외부 API 호출에 타임아웃/재시도/fallback 명시
  □ 빈 catch 없음
  □ 에러 메시지 한국어 확인

Step 4: UI 상태
  □ Loading / Success / Error 3가지 모두 도달 가능
  □ Error가 Success 분기 안에 숨어있지 않음

Step 5: 보안 (web-saas EXT)
  □ 모든 API Route에 인증 미들웨어 적용
  □ 시크릿 하드코딩 없음 (.env.local 사용)
  □ Supabase 모든 테이블 RLS 활성화
  □ Notion 쓰기 코드 없음 (CONSTITUTION 원칙 5)
  □ UI 텍스트 전체 한국어 (CONSTITUTION 원칙 4)
  □ 개인 메모 외부 전송 코드 없음 (CONSTITUTION 원칙 2)

Step 6: AI 품질 (ai-agent-product EXT)
  □ 시스템 프롬프트 lib/rag/prompts.ts 에 분리 관리
  □ Claude API 호출 시 입력/출력 토큰 로깅
  □ RAG 실패 시 fallback 메시지 존재
  □ 컨텍스트 토큰 한도 초과 방어 코드 존재
  □ pgvector 쿼리 인덱스 사용

Step 7: 문서 동기화
  □ PLANS.md 체크리스트 반영
  □ open-decisions 관련 항목 처리
  □ 필요 시 tech-debt 등록
```

---

## Pack Extensions

### web-saas EXT — SaaS 보안 기준

**인증/인가:**
| 항목 | 기준 |
|------|------|
| 모든 API Route | 인증 확인 (미인증 시 401) |
| 데이터 접근 | user_id 소유권 확인 (1인 사용자이므로 세션 존재 여부로 대체 가능) |

**DB 보안 (Supabase):**
| 항목 | 기준 |
|------|------|
| RLS | 모든 테이블 활성화 필수 |
| Service Role | 서버 전용, 클라이언트 절대 사용 금지 |
| 환경변수 | `NEXT_PUBLIC_*`만 클라이언트 노출 허용 |

**성능 기준:**
| 항목 | 목표 |
|------|------|
| API 응답 시간 | < 500ms (p95, RAG 제외) |
| 페이지 초기 로딩 | < 2초 |
| DB 쿼리 | N+1 없음 |
| RAG 응답 (스트리밍 첫 토큰) | < 3초 |

### ai-agent-product EXT — AI 품질 기준

**응답 품질:**
| 항목 | 기준 |
|------|------|
| RAG 응답 지연 (p95) | 10초 이내 (스트리밍 기준) |
| 스트리밍 첫 토큰 | 3초 이내 |
| 프롬프트 안정성 | 같은 질문 → 일관된 참조 출처 형식 |

**토큰 비용:**
| 항목 | 기준 |
|------|------|
| 단일 요청 최대 컨텍스트 | 8K 토큰 이내 (top-5 청크 × 500자) |
| 모든 API 호출 | 입력/출력 토큰 수 로깅 필수 |

**프롬프트 관리:**
- 시스템 프롬프트: `lib/rag/prompts.ts` 단일 파일로 관리, git 버전 관리
- 프롬프트 변경 시: PLANS.md §3 검증 예시 질문 3가지로 회귀 테스트
- 독서 기록 미존재 시: "관련 독서 기록을 찾지 못했습니다" 고정 응답
