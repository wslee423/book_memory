# open-decisions.md — 미결 의사결정

| ID | 결정 사항 | 우선순위 | 결정 필요 시점 | 옵션 |
|----|---------|---------|-------------|------|
| OD-001 | 임베딩 모델 선택 | 🔴 **Blocker** | Phase 3 착수 전 (스키마 vector 차원 결정에 영향) | OpenAI text-embedding-3-small (1536차원) / Anthropic 임베딩 (1024차원) |
| OD-002 | Notion 표지 이미지 처리 | 🟡 Medium | Phase 2 완료 전 | 임시 URL 저장만 (만료 허용) / Supabase Storage에 복사 |
| OD-003 | 대화 이력 보존 기간 | 🟢 Low | Phase 3 완료 전 | 무제한 / N개월 후 삭제 |
