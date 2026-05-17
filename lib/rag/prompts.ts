import type { SearchResult } from '@/lib/rag/search'

export function buildSystemPrompt(): string {
  return `당신은 운섭의 개인 AI 독서 비서입니다.
운섭이 읽은 책에서 남긴 메모, 하이라이트, 생각들을 기반으로 답변하세요.
반드시 제공된 독서 기록에서 근거를 찾아 답변하고, 어떤 책의 어떤 내용을 참조했는지 출처를 명시하세요.
독서 기록에 없는 내용은 "관련 독서 기록을 찾지 못했습니다"라고 답하세요.
답변은 한국어로 작성하세요.`
}

export function buildContextBlock(results: SearchResult[]): string {
  if (results.length === 0) return '(관련 독서 기록 없음)'
  return results
    .map((r, i) => `[${i + 1}] ${r.content}`)
    .join('\n\n')
}

export function buildUserMessage(question: string, contextBlock: string): string {
  return `[독서 기록]\n${contextBlock}\n\n[질문]\n${question}`
}
