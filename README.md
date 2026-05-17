# book_memory

개인 AI 독서 비서 — 읽은 책과 메모를 삶의 의사결정에 연결해주는 도구.

> 운섭 1인 사용. 외부 공개 없음.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 책장 | 갤러리 / 테이블 뷰, 상태·분류·별점·키워드 필터, 검색 |
| 책 상세 | 하이라이트·메모·AI 대화·일기 탭, 인라인 메모 CRUD |
| 책 정보 수정 | 제목·저자·분류·별점·독서 기간 등 상세 페이지 내 인라인 편집 |
| 새 책 등록 | 기존 분류 자동완성 + 신규 분류 직접 입력 |
| 독서 통계 | 연도×월 히트맵, 분류별 독서량, 개요 지표 |
| 독서 타임라인 | 월별 완독 기록 타임라인 |
| AI 독서메이트 | RAG 기반 채팅 — 내 독서 기록에서 근거를 찾아 답변 |

---

## 기술 스택

| 역할 | 선택 |
|------|------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Styling | Tailwind CSS |
| DB / Auth | Supabase (PostgreSQL + pgvector + Auth) |
| AI — 임베딩 | OpenAI `text-embedding-3-small` (1536d) |
| AI — 이미지 텍스트 추출 | OpenAI `gpt-4o-mini` Vision |
| AI — 채팅 | OpenAI `gpt-5.4-mini` (NDJSON 스트리밍) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
book_memory/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (모두 인증 필수)
│   │   ├── books/              # 책 CRUD, 메모 CRUD
│   │   ├── mate/               # AI 채팅, 세션 기록
│   │   ├── stats/              # 독서 통계
│   │   └── books/timeline/     # 독서 타임라인
│   ├── bookshelf/              # 책장 + 책 상세 + 새 책 등록
│   ├── stats/                  # 통계 페이지
│   ├── timeline/               # 타임라인 페이지
│   └── mate/                   # AI 독서메이트 페이지
├── components/
│   ├── bookshelf/              # 책장 관련 UI
│   ├── features/               # 통계, AI 메이트 UI
│   └── ui/                     # 공통 컴포넌트
├── lib/
│   ├── supabase/               # Supabase 클라이언트 + 쿼리 함수
│   ├── rag/                    # 임베딩, 검색, 프롬프트
│   ├── openai/                 # OpenAI 클라이언트 (lazy singleton)
│   ├── constants/              # 공통 상수 (STATUS_OPTIONS 등)
│   └── utils/                  # 포맷 유틸
├── scripts/
│   ├── migrate-notion.ts       # Notion → Supabase 마이그레이션
│   ├── embed-all.ts            # 전체 임베딩 배치 생성
│   └── merge-pages.ts          # 분할 메모 병합 (임베딩 품질 개선)
└── types/
    └── index.ts                # 공유 타입 정의
```

---

## DB 스키마 (book_memory 스키마)

| 테이블 | 설명 |
|--------|------|
| `books` | 책 메타데이터 (제목, 저자, 분류, 상태, 별점 등) |
| `book_pages` | 하이라이트·메모·AI 대화·일기·이미지 |
| `embeddings` | pgvector 임베딩 (book_pages 1:N) |
| `chat_history` | AI 독서메이트 대화 기록 |

---

## 시작하기

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 편집 — SUPABASE_*, OPENAI_API_KEY 입력

# 개발 서버 실행
npm run dev
```

---

## 스크립트

```bash
# Notion → Supabase 마이그레이션 (upsert — 중복 없음)
npm run migrate

# 분할 메모 병합 (임베딩 품질 개선 전처리)
npm run merge-pages

# 전체 임베딩 배치 생성
npm run embed

# 타입 검사
npm run typecheck

# 린트
npm run lint
```

---

## AI 독서메이트 동작 원리

1. 사용자 질문 → `text-embedding-3-small`로 쿼리 임베딩 생성
2. `embeddings` 테이블에서 cosine 유사도 상위 5개 메모 검색
3. 검색 결과를 컨텍스트로 `gpt-5.4-mini`에게 전달
4. NDJSON 스트리밍으로 답변 반환 + 출처 책 제시

---

## 환경변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `NOTION_API_KEY` | Notion 마이그레이션용 (선택) |
| `NOTION_DATABASE_ID` | 마이그레이션 대상 Notion DB ID (선택) |
