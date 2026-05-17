import OpenAI from 'openai'

// 클라이언트는 호출 시점에 생성 — 스크립트 환경에서 .env.local 로딩 순서 보장
let _openai: OpenAI | null = null

function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  const item = response.data[0]
  if (!item) throw new Error('임베딩 응답이 비어있습니다.')
  return item.embedding
}

// 이미지 URL에서 텍스트 추출 (GPT-4o-mini Vision)
export async function extractImageText(imageUrl: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: '이 이미지에 있는 텍스트를 정확히 그대로 추출해주세요. 이미지에 텍스트가 없으면 이미지 내용을 한국어로 간략하게 설명해주세요.',
          },
        ],
      },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}

// 단락(\n\n) 경계 우선, 초과 시 maxLen으로 강제 분할
export function chunkText(text: string, maxLen = 500): string[] {
  if (text.length <= maxLen) return [text]

  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    const joined = current ? `${current}\n\n${para}` : para
    if (current && joined.length > maxLen) {
      chunks.push(current.trim())
      current = para
    } else {
      current = joined
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks.flatMap((c) => {
    if (c.length <= maxLen) return [c]
    const sub: string[] = []
    for (let i = 0; i < c.length; i += maxLen) sub.push(c.slice(i, i + maxLen))
    return sub
  })
}
