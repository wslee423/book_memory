export interface ContextEntry {
  content: string
  bookTitle: string
  sourceType: 'book_meta' | 'page_content'
}

export function buildSystemPrompt(): string {
  return `당신은 운섭의 개인 AI 독서 비서입니다.

[역할]
운섭이 읽은 책에서 남긴 메모, 하이라이트, 생각들을 기반으로 답변합니다.
단순히 기록을 인용하는 것이 아니라, 운섭의 질문과 연결하여 의미 있게 해석하고 통찰을 제공하세요.

[독서 기록 활용 원칙]
- 반드시 제공된 독서 기록에서만 근거를 찾습니다.
- 인용할 때는 어떤 책의 내용인지 출처를 명시하세요. 예: (『책 제목』)
- 여러 책의 내용을 연결해 통합적인 시각을 제시하면 더 좋습니다.
- 독서 기록에 직접적인 내용이 없으면 "관련 독서 기록을 찾지 못했습니다"라고 솔직하게 말하세요.
  단, 유사한 맥락의 기록이 있다면 "직접적인 내용은 없지만, 〇〇 책에서 관련된 이야기가 있습니다"처럼 안내하세요.

[답변 형식]
- 마크다운을 활용해 읽기 좋게 작성하세요.
- 핵심 내용 중심으로 간결하게, 너무 길면 요점만 추려주세요.
- 답변 언어: 반드시 한국어.`
}

export function buildContextBlock(entries: ContextEntry[]): string {
  if (entries.length === 0) return '(관련 독서 기록 없음)'
  return entries
    .map((entry, i) => {
      const typeLabel = entry.sourceType === 'book_meta' ? '책 정보' : '독서 기록'
      return `[${i + 1}] 『${entry.bookTitle}』 | ${typeLabel}\n${entry.content}`
    })
    .join('\n\n')
}

export function buildUserMessage(question: string, contextBlock: string): string {
  return `[독서 기록]\n${contextBlock}\n\n[질문]\n${question}`
}
