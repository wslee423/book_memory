# PLANS.md — book_memory 개발 로드맵

---

## 목표

Notion "나의 책장" 데이터를 Supabase로 이관하고, 책장 웹서비스(Phase 1~2)와 AI 독서메이트(Phase 3)를 순차적으로 구축한다.
운섭 1인 사용, 외부 공개 없음. 빠른 실사용을 목표로 Phase 2 완료 시 즉시 운용 시작.

---

## Phase 구조

| Phase | 이름 | 목표 | 상태 |
|-------|------|------|------|
| Phase 1 | 기반 세팅 | 개발 환경 + Supabase 스키마 + 마이그레이션 | 🔲 |
| Phase 2 | 책장 MVP | 책 목록·상세·필터·검색 완성 | 🔲 |
| Phase 3 | AI 독서메이트 | RAG 파이프라인 + 채팅 UI | 🔲 |
| Phase 4 | 고도화 | 독서 회고·통계·UX 개선 | 🔲 |

상태: 🔲 미시작 / 🔄 진행 중 / ✅ 완료

---

## Phase 1 — 기반 세팅

**목표**: 개발 환경 + 스키마 + Notion 데이터 이관 완료. 이 Phase 없이 Phase 2 시작 불가.

### 완료 조건 (Phase Gate)
- [ ] Next.js 14 프로젝트 초기화 (TypeScript strict, Tailwind)
- [ ] Supabase 프로젝트 생성 + 스키마 적용 (books, book_pages, embeddings, chat_history)
- [ ] RLS 정책 적용 확인
- [ ] Notion → Supabase 마이그레이션 스크립트 완성
- [ ] 마이그레이션 실행 완료 (전체 책 데이터 + 페이지 내용)
- [ ] Vercel 배포 파이프라인 연결
- [ ] typecheck/lint 경고 0건

### 작업 목록
- [ ] Next.js 프로젝트 초기화
- [ ] Supabase 설정 + 환경변수
- [ ] DB 스키마 SQL 작성 + 실행
- [ ] RLS 정책 설정
- [ ] TypeScript 타입 정의 (types/index.ts)
- [ ] Notion API 클라이언트 (lib/notion/)
- [ ] 마이그레이션 스크립트 (scripts/migrate-notion.ts)
  - books 테이블 이관 (메타데이터)
  - book_pages 테이블 이관 (페이지 내용 파싱)
  - 표지 이미지 URL 보존
- [ ] 마이그레이션 실행 + 검증
- [ ] Vercel 배포 연결

---

## Phase 2 — 책장 MVP

**목표**: 실제로 쓸 수 있는 나만의 책장 웹서비스.

### 완료 조건 (Phase Gate)
- [ ] 책 목록 페이지 동작 (갤러리 뷰 + 표 뷰 전환)
- [ ] 책 상세 페이지 동작 (메타데이터 + 페이지 내용)
- [ ] 필터 동작 (상태 / 분류 / 별점 / 키워드)
- [ ] 검색 동작 (제목·저자·내용 텍스트 검색)
- [ ] typecheck/lint 경고 0건
- [ ] Vercel 배포 후 실사용 시작

### 작업 목록
- [ ] Supabase 클라이언트 함수 (lib/supabase/)
- [ ] API Routes
  - [ ] GET /api/books (목록, 필터, 검색)
  - [ ] GET /api/books/[id] (상세 + 페이지 내용)
  - [ ] POST /api/books/[id]/pages (메모 추가 — book_pages 테이블 insert)
- [ ] 책장 목록 UI
  - [ ] 갤러리 뷰 (표지 이미지 중심)
  - [ ] 표 뷰 (전체 메타데이터)
  - [ ] 뷰 전환 토글
- [ ] 필터 UI (상태, 분류, 별점, 키워드)
- [ ] 검색 UI
- [ ] 책 상세 UI
  - [ ] 메타데이터 섹션 (별점, 기간, 키워드, 한줄 요약)
  - [ ] 페이지 내용 뷰어 (하이라이트·메모·AI 대화 구분)
- [ ] 에러 상태 + 로딩 상태 처리

---

## Phase 3 — AI 독서메이트

**목표**: 내 독서 기록에서 자연어로 찾고 연결하는 RAG 비서.

### 완료 조건 (Phase Gate)
- [ ] 임베딩 생성 배치 완료 (전체 book_pages)
- [ ] RAG 파이프라인 동작 확인
- [ ] 채팅 UI 완성
- [ ] 참조 출처(책명·페이지) 함께 표시
- [ ] 응답 품질 자체 검증 (3가지 예시 질문 테스트)

### 작업 목록
- [ ] 임베딩 모델 결정 (OD-001 처리) → ARCHITECTURE.md vector 차원 확정
- [ ] 임베딩 생성 API (lib/rag/embed.ts)
- [ ] 배치 임베딩 스크립트 (scripts/embed-all.ts)
- [ ] RAG 검색 함수 (lib/rag/search.ts)
- [ ] 시스템 프롬프트 (lib/rag/prompts.ts)
- [ ] Claude API 클라이언트 (lib/anthropic/)
- [ ] API Route: POST /api/mate/chat
- [ ] API Route: POST /api/embed (배치 트리거용)
- [ ] 채팅 UI (스트리밍 응답)
- [ ] 참조 출처 카드 컴포넌트
- [ ] 대화 이력 저장 + 불러오기

**검증 예시 질문:**
1. "내가 불편함을 피하려고만 하면 발생하는 문제에 대해 읽었던 내용 찾아줘"
2. "자산관리 관련해서 읽은 책들의 핵심 메모 정리해줘"
3. "최근 별점 5개 준 책들의 공통점을 분석해줘"

---

## Phase 4 — 고도화

**목표**: 더 풍부한 독서 경험 + UX 개선.

### 작업 목록 (우선순위 미정)
- [ ] 독서 통계 대시보드 (월별 독서량, 분류 분포, 별점 분포)
- [ ] 독서 회고 화면 (날짜별 타임라인)
- [ ] 책 등록 UI (새 책 수동 추가)
- [ ] 메모 추가 UI (책 상세에서 직접 메모 작성)
- [ ] 다크모드
- [ ] 모바일 반응형 최적화

---

## 원칙

1. Phase Gate 통과 후 다음 Phase 진입
2. 동작하는 것 먼저 — 완벽함보다 실사용 우선
3. 데이터 손실 절대 금지 (CONSTITUTION 원칙 1)
